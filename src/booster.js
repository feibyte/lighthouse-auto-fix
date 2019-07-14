'use strict';

const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { minify } = require('html-minifier');
const setup = require('./setup');
const ImageOptimizer = require('./optimizers/ImageOptimizer');
const ScriptOptimizer = require('./optimizers/ScriptOptimizer');
const StyleOptimizer = require('./optimizers/StyleOptimizer');
const HTMLOptimizer = require('./optimizers/HTMLOptimizer');
const crawl = require('./crawl');
const { getAuditItems, isSameSite, toLocalPathFromUrl } = require('./utils/helper');

const optimizers = [ImageOptimizer, StyleOptimizer, ScriptOptimizer, HTMLOptimizer];

async function autoFix(config) {
  const { srcDir, destDir, artifacts, audits } = config;
  const context = { srcDir, destDir };
  const pageUrl = artifacts.URL.finalUrl;
  const indexHtml = toLocalPathFromUrl(pageUrl, srcDir);
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
  await fs.outputFile(toLocalPathFromUrl(pageUrl, destDir), minifiedHtml);
}

const projectDir = path.resolve(__dirname, '..');

const booster = async (entryUrl, config) => {
  const result = await setup(entryUrl, {
    emulatedFormFactor: 'desktop',
    logLevel: 'silent',
  });
  const {
    artifacts,
    lhr: { audits },
  } = result;
  const networkRequests = getAuditItems(audits, 'network-requests') || [];
  const pageUrl = artifacts.URL.finalUrl;
  const filteredRequests = networkRequests
    .filter(request => request.statusCode === 200 && isSameSite(request.url, pageUrl))
    .map(request => request.url);
  const srcDir = path.resolve(projectDir, './server/www');
  await crawl(filteredRequests, srcDir);
  await autoFix({
    srcDir,
    destDir: path.resolve(process.cwd(), config.outDir),
    artifacts,
    audits,
  });
};

module.exports = booster;
