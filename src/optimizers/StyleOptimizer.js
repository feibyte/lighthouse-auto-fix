'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcss = require('postcss');
const {
  computeCSSTokenLength,
} = require('lighthouse/lighthouse-core/lib/minification-estimator.js');
const Optimizer = require('./Optimizer');

const { URL } = url;

const SMALL_FILE_TOKEN_LENGTH = 12 * 1024;

const USAGE_THRESHOLD = 0.4; // We assume usage rate lower than 50% is low;

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

  static extractStyleSheets(artifacts) {
    const { rules, stylesheets } = artifacts.CSSUsage;
    return stylesheets
      .filter(stylesheet => !stylesheet.header.isInline && stylesheet.header.sourceURL)
      .map(stylesheet => {
        const stylesheetRules = rules.filter(
          rule => rule.styleSheetId === stylesheet.header.styleSheetId
        );
        const usedContent = stylesheetRules
          .map(rule => stylesheet.content.slice(rule.startOffset, rule.endOffset))
          .join('\n');
        const usagePercent =
          computeCSSTokenLength(usedContent) / computeCSSTokenLength(stylesheet.content);
        return {
          src: stylesheet.header.sourceURL,
          content: stylesheet.content,
          isSmallSize: computeCSSTokenLength(stylesheet.content) <= SMALL_FILE_TOKEN_LENGTH,
          isCritical: artifacts.TagsBlockingFirstPaint.map(tagInfo => tagInfo.url).includes(
            stylesheet.header.sourceURL
          ),
          usedContent,
          isLowUsage: usagePercent < USAGE_THRESHOLD,
        };
      });
  }

  static async optimizeStyleSheet(stylesheet, context) {
    const stylesheetUrl = new URL(stylesheet.src);
    const isUrlFromCurrentSite = stylesheetUrl.origin === context.siteURL.origin;
    if (!isUrlFromCurrentSite) {
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

  static async applyOptimizedStylesheet($element, stylesheet) {
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

  static async optimize($, artifacts, context) {
    const stylesheets = await Promise.all(
      this.extractStyleSheets(artifacts).map(stylesheet =>
        this.optimizeStyleSheet(stylesheet, context)
      )
    );
    const stylesheetMapByUrl = new Map();
    stylesheets.forEach(image => stylesheetMapByUrl.set(image.src, image));
    const pageUrl = artifacts.URL.finalUrl;
    $('link[href][rel="stylesheet"]').each((i, element) => {
      const stylesheetUrl = decodeURIComponent(url.resolve(pageUrl, $(element).attr('href')));
      const stylesheet = stylesheetMapByUrl.get(stylesheetUrl);
      if (stylesheet) {
        this.applyOptimizedStylesheet($(element), stylesheet);
      } else {
        console.warn(
          `Lack information of stylesheet which url is ${stylesheetUrl}. There must be something wrong.`
        );
      }
    });
  }
}

module.exports = StyleOptimizer;
