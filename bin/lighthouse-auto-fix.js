#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const booster = require('../src/index');
const logger = require('../src/utils/logger');

(() => {
  const flags = yargs
    .usage('lighthouse-auto-fix <url>')
    .option('out-dir', {
      alias: 'd',
      default: 'dist',
      describe: 'set the output directory. defaults to "dist"',
    })
    .option('device', {
      default: 'desktop',
      choices: ['mobile', 'desktop'],
    })
    .check(argv => {
      if (argv._.length > 0) {
        return true;
      }
      throw new Error('Please provide a url');
    })
    .help('help').argv;
  const entryUrl = flags._[0];
  const config = {
    outDir: flags.outDir,
  };
  booster(entryUrl, config)
    .then(() => {
      logger.log('Optimization Finished!');
      logger.log(`Optimized files are located in ${flags.outDir}`);
    })
    .catch(err => {
      logger.error(err);
    });
})();
