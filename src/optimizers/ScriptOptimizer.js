'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const UglifyJS = require('uglify-es');
const Optimizer = require('./Optimizer');

const { URL } = url;

class ScriptOptimizer extends Optimizer {
  static get meta() {
    return {
      requiredArtifacts: ['ScriptElements', 'URL'],
    };
  }

  static extract(artifacts) {
    return artifacts.ScriptElements.filter(scriptElement => scriptElement.src).map(
      scriptElement => {
        return {
          ...scriptElement,
          shouldMinify: true,
        };
      }
    );
  }

  static async optimizeScript(script, context) {
    const scriptUrl = new URL(script.src);
    const isUrlFromCurrentSite = scriptUrl.origin === context.siteURL.origin;
    if (isUrlFromCurrentSite && script.shouldMinify) {
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

  static async optimize($, artifacts, context) {
    const scripts = await Promise.all(
      this.extract(artifacts).map(script => this.optimizeScript(script, context))
    );
    const scriptMapByUrl = new Map();
    scripts.forEach(script => scriptMapByUrl.set(script.src, script));
    const pageUrl = artifacts.URL.finalUrl;
    $('script[src]').each((i, element) => {
      const scriptUrl = decodeURIComponent(url.resolve(pageUrl, $(element).attr('src')));
      const script = scriptMapByUrl.get(scriptUrl);
      if (script) {
        this.applyOptimizedScript($(element), script);
      } else {
        console.warn(
          `Lack information of script which url is ${scriptUrl}. There must be something wrong.`
        );
      }
    });
  }
}

module.exports = ScriptOptimizer;
