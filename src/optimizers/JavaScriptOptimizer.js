'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const Optimizer = require('./Optimizer');

const { URL } = url;

class JavaScriptOptimizer extends Optimizer {
  static async optimizeOnElement($element, context) {
    const src = $element.attr('src');
    const scriptUrl = new URL(url.resolve(context.siteURL.toString(), src));
    const isUrlFromCurrentSite = scriptUrl.origin === context.siteURL.origin;
    if (!isUrlFromCurrentSite) {
      return;
    }
    const absolutePath = scriptUrl.pathname;
    const srcPath = path.resolve(context.srcDir, `.${absolutePath}`);
    const destPath = path.resolve(context.destDir, `.${absolutePath}`);
    const data = await fs.readFile(srcPath);
    await fs.outputFile(destPath, data);
  }

  static async optimize($, context) {
    const subTasks = [];
    $('script[src]').each((i, element) => {
      subTasks.push(this.optimizeOnElement($(element), context));
    });
    await Promise.all(subTasks);
  }
}

module.exports = JavaScriptOptimizer;
