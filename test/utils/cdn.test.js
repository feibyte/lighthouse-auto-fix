'use strict';

const fs = require('fs');
const path = require('path');

const {
  calcHash,
  lookupFilesByHash,
  generateUrl,
  findAvailableUrlByHash,
} = require('../../src/utils/cdn');

describe('calcHash()', () => {
  it('should calculate correct hash value on jquery file', () => {
    const buffer = fs.readFileSync(path.resolve(__dirname, './jquery.min.js'));
    expect(calcHash(buffer)).toEqual(
      '160a426ff2894252cd7cebbdd6d6b7da8fcd319c65b70468f10b6690c45d02ef'
    );
  });
});

describe('findCdnByHash()', () => {
  it('should get correct hash value on jquery file when given hash is matched', async () => {
    const result = await lookupFilesByHash(
      '160a426ff2894252cd7cebbdd6d6b7da8fcd319c65b70468f10b6690c45d02ef'
    );
    expect(result).toEqual({
      type: 'npm',
      name: 'jquery',
      version: '3.3.1',
      file: '/dist/jquery.min.js',
    });
  });
  it('should return error when given hash is not found', () => {
    lookupFilesByHash('160a426ff2894252cd7cebbdd6d6b7da8fcd319c65b70468f10b6690c45d02ee').catch(
      error => {
        expect(error).toEqual('Server Error 404');
      }
    );
  });
});

describe('generateUrl()', () => {
  it('should return url path of jsdelivr', () => {
    const url = generateUrl({
      type: 'npm',
      name: 'jquery',
      version: '3.3.1',
      file: '/dist/jquery.min.js',
    });
    expect(url).toEqual('https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js');
  });

  it('should return minification file when given file is not end with min.js or min.css', () => {
    const url = generateUrl({
      type: 'npm',
      name: 'jquery',
      version: '3.3.1',
      file: '/dist/jquery.js',
    });
    expect(url).toEqual('https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js');
  });
});

describe('findAvailableUrlByHash()', () => {
  it('should return available url on cdn when given hash is found', async () => {
    const url = await findAvailableUrlByHash(
      '160a426ff2894252cd7cebbdd6d6b7da8fcd319c65b70468f10b6690c45d02ef'
    );
    expect(url).toEqual('https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js');
  });
});
