'use strict';

const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const { minify } = require('html-minifier');
const setup = require('./setup');
const ImageOptimizer = require('./optimizers/ImageOptimizer');
const ScriptOptimizer = require('./optimizers/ScriptOptimizer');
const StyleOptimizer = require('./optimizers/StyleOptimizer');

const { URL } = url;

const optimizers = [ImageOptimizer, StyleOptimizer, ScriptOptimizer];

async function booster(config) {
  const { srcDir, destDir, siteURL, artifacts, audits } = config;
  const context = {
    srcDir,
    destDir,
    siteURL,
  };
  const { pathname } = new URL(url.resolve(siteURL.toString(), './index.html'));
  const indexHtml = path.resolve(srcDir, `.${pathname}`);
  const html = fs.readFileSync(indexHtml, 'utf8');
  const $ = cheerio.load(html);
  await Promise.all(optimizers.map(optimizer => optimizer.optimize($, artifacts, audits, context)));
  const minifiedHtml = minify($.html(), {
    collapseWhitespace: true,
    removeComments: true,
    removeTagWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
  });
  fs.outputFileSync(path.resolve(destDir, `.${pathname}`), minifiedHtml);
}

const projectDir = path.resolve(__dirname, '..');

const home = process.env.HOME || 'https://localhost';

setup(home, {
  emulatedFormFactor: 'desktop',
  logLevel: 'silent',
})
  .then(result => {
    return booster({
      srcDir: path.resolve(projectDir, './server/www'),
      destDir: path.resolve(projectDir, './server/dist'),
      siteURL: new URL(home),
      artifacts: result.artifacts,
      audits: result.lhr.audits,
    }).then(() => {
      console.log('Optimization Finished!');
      console.log('You could switch server root to "/server/dist/" and run lighthouse again.');
    });
  })
  .catch(err => {
    console.error(err);
  });

module.exports = booster;
