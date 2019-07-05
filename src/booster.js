'use strict';

const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const ImageOptimizer = require('./optimizers/ImageOptimizer');
const JavasScriptOptimizer = require('./optimizers/JavaScriptOptimizer');
const StyleOptimizer = require('./optimizers/StyleOptimizer');

const { URL } = url;

async function booster(config) {
  const { srcDir, destDir, siteURL, lighthouseResultFile } = config;
  const lighthouseResult = fs.readFileSync(lighthouseResultFile, 'utf8');
  const context = {
    srcDir,
    destDir,
    siteURL,
    audits: lighthouseResult.audits,
  };
  const { pathname } = new URL(url.resolve(siteURL.toString(), './index.html'));
  const indexHtml = path.resolve(srcDir, `.${pathname}`);
  const html = fs.readFileSync(indexHtml, 'utf8');
  const $ = cheerio.load(html);
  await ImageOptimizer.optimize($, context);
  await StyleOptimizer.optimize($, context);
  await JavasScriptOptimizer.optimize($, context);
  fs.outputFileSync(path.resolve(destDir, `.${pathname}`), $.html());
}

const projectDir = path.resolve(__dirname, '..');

const home = process.env.HOME || 'https://localhost';
booster({
  srcDir: path.resolve(projectDir, './server/www'),
  destDir: path.resolve(projectDir, './server/dist'),
  siteURL: new URL(home),
  lighthouseResultFile: path.resolve(projectDir, './server/lighthouse.json'),
}).then(
  () => {
    console.log('Optimization Finished!');
    console.log('You could switch server root to "/server/dist/" and run lighthouse again.');
  },
  err => {
    console.error(err);
  }
);

module.exports = booster;
