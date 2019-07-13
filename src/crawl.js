'use strict';

const request = require('request');
const fs = require('fs-extra');
const { toLocalPathFromUrl } = require('./utils/helper');
const logger = require('./utils/logger');

const crawl = async (urls, dir) => {
  logger.log('Star crawling remote website...');
  await fs.emptyDir(dir);
  await Promise.all(
    urls.map(url => {
      const filePath = toLocalPathFromUrl(url, dir);
      return fs
        .ensureFile(filePath)
        .then(
          () =>
            new Promise((resolve, reject) => {
              request
                .get(url)
                .on('error', reject)
                .pipe(fs.createWriteStream(filePath))
                .on('finish', resolve);
            })
        )
        .catch(err => logger.error(err));
    })
  );
  logger.log('Remote resources are downloaded to local');
};

module.exports = crawl;
