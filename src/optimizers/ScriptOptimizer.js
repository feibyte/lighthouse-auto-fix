'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const UglifyJS = require('uglify-es');
const Optimizer = require('./Optimizer');
const logger = require('../utils/logger');
const { isSameSite, toMapByKey, toFullPathUrl } = require('../utils/helper');

const { URL } = url;

class ScriptOptimizer extends Optimizer {
  static get meta() {
    return {
      requiredArtifacts: ['ScriptElements', 'URL'],
    };
  }

  static refine(artifacts) {
    const pageUrl = artifacts.URL.finalUrl;
    return artifacts.ScriptElements.filter(scriptElement => scriptElement.src).map(
      scriptElement => {
        return {
          ...scriptElement,
          isFromSameSite: isSameSite(pageUrl, scriptElement.src),
          shouldMinify: true,
        };
      }
    );
  }

  static async optimizeScript(script, context) {
    const scriptUrl = new URL(script.src);
    if (script.isFromSameSite && script.shouldMinify) {
      const result = UglifyJS.minify(script.content);
      if (!result.error) {
        const absolutePath = scriptUrl.pathname;
        const destPath = path.resolve(context.destDir, `.${absolutePath}`);
        await fs.outputFile(destPath, result.code);
      }
    }
    return script;
  }

  static applyOptimizedScript($element, script) {
    $element.attr('src', script.src);
  }

  static async optimize($, artifacts, audits, context) {
    const scripts = await Promise.all(
      this.refine(artifacts).map(script => this.optimizeScript(script, context))
    );
    const scriptMapByUrl = toMapByKey(scripts, 'src');
    const pageUrl = artifacts.URL.finalUrl;
    $('script[src]').each((i, element) => {
      const scriptUrl = toFullPathUrl(pageUrl, $(element).attr('src'));
      const script = scriptMapByUrl.get(scriptUrl);
      if (script) {
        this.applyOptimizedScript($(element), script);
      } else {
        logger.warn(`Lack information of script which url is ${scriptUrl}.`);
      }
    });
  }
}

module.exports = ScriptOptimizer;
