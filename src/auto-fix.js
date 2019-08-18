'use strict';

const cheerio = require('cheerio');
const fs = require('fs-extra');
const { minify } = require('html-minifier');
const ImageOptimizer = require('./optimizers/ImageOptimizer');
const ScriptOptimizer = require('./optimizers/ScriptOptimizer');
const StyleOptimizer = require('./optimizers/StyleOptimizer');
const HTMLOptimizer = require('./optimizers/HTMLOptimizer');
const PWAOptimizer = require('./optimizers/PWAOptimizer');
const { toLocalPathFromUrl } = require('./utils/helper');

const optimizers = [ImageOptimizer, StyleOptimizer, ScriptOptimizer, HTMLOptimizer];

async function autoFix(config) {
  const { srcDir, destDir, artifacts, audits } = config;
  const context = { srcDir, destDir, resources: [] };
  const pageUrl = artifacts.URL.finalUrl;
  const indexHtml = toLocalPathFromUrl(pageUrl, srcDir);
  const html = fs.readFileSync(indexHtml, 'utf8');
  const $ = cheerio.load(html);
  await Promise.all(optimizers.map(optimizer => optimizer.optimize($, artifacts, audits, context)));
  await PWAOptimizer.optimize($, artifacts, audits, context);
  const minifiedHtml = minify($.html(), {
    collapseWhitespace: true,
    removeComments: true,
    removeTagWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
  });
  await fs.outputFile(toLocalPathFromUrl(pageUrl, destDir), minifiedHtml);
}

module.exports = autoFix;
