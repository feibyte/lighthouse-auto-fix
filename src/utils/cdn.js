'use strict';

const crypto = require('crypto');
const request = require('request');

const hash = crypto.createHash('sha256');

const calcHash = content => {
  hash.update(content);
  return hash.digest('hex');
};

// See https://github.com/jsdelivr/data.jsdelivr.com/issues/9
const lookupFilesByHash = hashHex => {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://data.jsdelivr.com/v1/lookup/hash/${hashHex}`,
        json: true,
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode === 200) {
          resolve(body);
        } else {
          reject(new Error(`Server Error ${response.statusCode}`));
        }
      }
    );
  });
};

const generateUrl = ({ type, name, version, file }) => {
  const url = `https://cdn.jsdelivr.net/${type}/${name}@${version}${file}`;
  if (/min.(css|js)$/.test(url)) {
    return url;
  }
  return url.replace(/(css|js)$/, 'min.$1');
};

const findAvailableUrlByHash = hashHex => lookupFilesByHash(hashHex).then(generateUrl);

module.exports = {
  calcHash,
  lookupFilesByHash,
  generateUrl,
  findAvailableUrlByHash,
};
