'use strict';

const url = require('url');
const path = require('path');
const _ = require('lodash');

const toUrlFromPath = (destDir, destPath) => `/${path.relative(destDir, destPath)}`;

const toLocalPathFromUrl = (src, dir) => {
  const { pathname } = new URL(src);
  let filePath = pathname;
  if (/\/$/.test(filePath)) {
    filePath += 'index.html';
  }
  return path.resolve(dir, `.${filePath}`);
};

const isSameSite = (urlStringA, urlStringB) => {
  if (!urlStringA || !urlStringB) {
    return false;
  }
  const urlA = new URL(urlStringA);
  const urlB = new URL(urlStringB);
  return urlB.origin === urlA.origin;
};

const toMapByKey = (array, key) => {
  const map = new Map();
  array.forEach(item => map.set(item[key], item));
  return map;
};

const toFullPathUrl = (pageUrl, src) => {
  return decodeURIComponent(url.resolve(pageUrl, src));
};

const getAuditItems = (audits, key) => _.get(audits, `["${key}"].details.items`) || [];

module.exports = {
  toUrlFromPath,
  toLocalPathFromUrl,
  isSameSite,
  toMapByKey,
  toFullPathUrl,
  getAuditItems,
};
