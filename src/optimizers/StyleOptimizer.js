'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcss = require('postcss');
const {
  computeCSSTokenLength,
} = require('lighthouse/lighthouse-core/lib/minification-estimator.js');
const logger = require('../utils/logger');
const { isSameSite, toMapByKey, toFullPathUrl } = require('../utils/helper');
const Optimizer = require('./Optimizer');

const { URL } = url;

const SMALL_FILE_TOKEN_LENGTH = 12 * 1024;

const WASTE_THRESHOLD = 60;

/**
 * Optimize Strategy
 * 1. Ignore inline style
 * 2. If a css is is really small (less than 2K), insert it into HTML
 * 3. For big file, if usage is low, Extract used part in css file into HTML, defer the request.
 * 4. Optimize it with postcss.
 */
class StyleOptimizer extends Optimizer {
  static get meta() {
    return {
      requiredArtifacts: ['CSSUsage', 'URL'],
    };
  }

  static refine(artifacts, audits) {
    const pageUrl = artifacts.URL.finalUrl;
    const { rules, stylesheets } = artifacts.CSSUsage;

    const unusedCss = _.get(audits, '["unused-css-rules"].details.teams', []);
    const unusedCSSMapByUrl = toMapByKey(unusedCss, 'url');

    return stylesheets
      .filter(stylesheet => !stylesheet.header.isInline && stylesheet.header.sourceURL)
      .map(stylesheet => {
        const stylesheetRules = rules.filter(
          rule => rule.styleSheetId === stylesheet.header.styleSheetId
        );
        const usedContent = stylesheetRules
          .map(rule => stylesheet.content.slice(rule.startOffset, rule.endOffset))
          .join('\n');

        const src = stylesheet.header.sourceURL;
        const unusedInfo = unusedCSSMapByUrl.get(src);
        const isLowUsage = unusedInfo ? unusedInfo.wastedPercent > WASTE_THRESHOLD : false;
        return {
          src,
          isFromSameSite: isSameSite(pageUrl, src),
          content: stylesheet.content,
          isSmallSize: computeCSSTokenLength(stylesheet.content) <= SMALL_FILE_TOKEN_LENGTH,
          isCritical: artifacts.TagsBlockingFirstPaint.map(tagInfo => tagInfo.url).includes(src),
          usedContent,
          isLowUsage,
        };
      });
  }

  static async optimizeStyleSheet(stylesheet, context) {
    const stylesheetUrl = new URL(stylesheet.src);
    if (!stylesheet.isFromSameSite) {
      return stylesheet;
    }
    const { pathname } = stylesheetUrl;
    const srcPath = path.resolve(context.srcDir, `.${pathname}`);
    const destPath = path.resolve(context.destDir, `.${pathname}`);
    const processedResult = await postcss([autoprefixer(), cssnano()]).process(stylesheet.content, {
      from: srcPath,
      to: destPath,
    });
    await fs.outputFile(destPath, processedResult.css);
    const processedUsedResult = await postcss([autoprefixer(), cssnano()]).process(
      stylesheet.usedContent,
      {
        from: srcPath,
        to: destPath,
      }
    );
    return {
      ...stylesheet,
      content: processedResult.css,
      usedContent: processedUsedResult.css,
    };
  }

  static applyOptimizedStylesheet($element, stylesheet) {
    if (stylesheet.isSmallSize) {
      $element.before(`<style>${stylesheet.content}</style>`);
      $element.remove();
    } else if (stylesheet.isLowUsage) {
      $element.before(`
        <style data-replaced-url="${stylesheet.src}">${stylesheet.usedContent}</style>
      `);
      $element.remove();
    } else {
      $element.before(`
        <link rel="preload" href="${stylesheet.src}" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="${stylesheet.src}"></noscript>
      `);
      $element.remove();
    }
  }

  static ensureSupportPreload() {}

  static async optimize($, artifacts, audits, context) {
    const stylesheets = await Promise.all(
      this.refine(artifacts).map(stylesheet => this.optimizeStyleSheet(stylesheet, context))
    );
    const stylesheetMapByUrl = toMapByKey(stylesheets, 'src');
    const pageUrl = artifacts.URL.finalUrl;
    $('link[href][rel="stylesheet"]').each((i, element) => {
      const stylesheetUrl = toFullPathUrl(pageUrl, $(element).attr('href'));
      const stylesheet = stylesheetMapByUrl.get(stylesheetUrl);
      if (stylesheet) {
        this.applyOptimizedStylesheet($(element), stylesheet);
      } else {
        logger.warn(`Lack information of stylesheet which url is ${stylesheetUrl}.`);
      }
    });
  }
}

module.exports = StyleOptimizer;
