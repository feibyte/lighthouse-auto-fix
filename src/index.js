'use strict';

const path = require('path');
const setup = require('./setup');
const crawl = require('./crawl');
const { getAuditItems, isSameSite } = require('./utils/helper');
const autoFix = require('./auto-fix');

const projectDir = path.resolve(__dirname, '..');

const booster = async (entryUrl, config) => {
  const result = await setup(entryUrl, {
    emulatedFormFactor: config.device,
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
