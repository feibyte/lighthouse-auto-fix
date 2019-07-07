'use strict';

const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const ImageOptimizer = require('./optimizers/ImageOptimizer');
const ScriptOptimizer = require('./optimizers/ScriptOptimizer');
const StyleOptimizer = require('./optimizers/StyleOptimizer');

const { URL } = url;

async function booster(config) {
  const { srcDir, destDir, siteURL, artifactsFile } = config;
  const artifacts = fs.readJsonSync(artifactsFile);
  const context = {
    srcDir,
    destDir,
    siteURL,
  };
  const { pathname } = new URL(url.resolve(siteURL.toString(), './index.html'));
  const indexHtml = path.resolve(srcDir, `.${pathname}`);
  const html = fs.readFileSync(indexHtml, 'utf8');
  const $ = cheerio.load(html);
  await ImageOptimizer.optimize($, artifacts, context);
  await StyleOptimizer.optimize($, artifacts, context);
  await ScriptOptimizer.optimize($, artifacts, context);
  fs.outputFileSync(path.resolve(destDir, `.${pathname}`), $.html());
}

const projectDir = path.resolve(__dirname, '..');

const home = process.env.HOME || 'https://localhost';
booster({
  srcDir: path.resolve(projectDir, './server/www'),
  destDir: path.resolve(projectDir, './server/dist'),
  siteURL: new URL(home),
  artifactsFile: path.resolve(projectDir, './server/artifacts.json'),
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
