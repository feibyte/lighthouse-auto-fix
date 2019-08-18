'use strict';

const path = require('path');
const { generateSW } = require('workbox-build');
const Optimizer = require('./Optimizer');

class PWAOptimizer extends Optimizer {
  static async optimize($, artifacts, audits, context) {
    await generateSW({
      swDest: path.resolve(context.destDir, './sw.js'),
      globDirectory: context.destDir,
      globPatterns: ['**/*.{js,png,html,css,json,webp,jpeg}'],
    });
    $('body').append(`
      <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js');
        });
      }
      </script>
    `);
  }
}

module.exports = PWAOptimizer;
