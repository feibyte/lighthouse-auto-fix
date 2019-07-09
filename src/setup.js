'use strict';

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const launchChromeAndRunLighthouse = (url, opts = {}, config = null) => {
  return chromeLauncher.launch({ chromeFlags: ['--headless'] }).then(chrome => {
    return lighthouse(url, { ...opts, port: chrome.port }, config).then(results => {
      return chrome.kill().then(() => results);
    });
  });
};

module.exports = launchChromeAndRunLighthouse;
