'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const Optimizer = require('./Optimizer');

const { URL } = url;

class ImageOptimizer extends Optimizer {
  static async optimizeOnElement($element, context) {
    const src = $element.attr('src');
    const imageUrl = new URL(url.resolve(context.siteURL.toString(), src));
    const isUrlFromCurrentSite = imageUrl.origin === context.siteURL.origin;
    if (!isUrlFromCurrentSite) {
      return;
    }
    const absolutePath = imageUrl.pathname;
    const srcPath = path.resolve(context.srcDir, `.${absolutePath}`);
    const destPath = path.resolve(context.destDir, `.${absolutePath}`);
    const data = await fs.readFile(srcPath);
    await fs.outputFile(destPath, data);
  }

  static async optimize($, context) {
    const subTasks = [];
    $('img').each((i, element) => {
      subTasks.push(this.optimizeOnElement($(element), context));
    });
    await Promise.all(subTasks);
  }
}

module.exports = ImageOptimizer;
