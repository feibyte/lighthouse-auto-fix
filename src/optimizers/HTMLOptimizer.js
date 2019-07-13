'use strict';

const Optimizer = require('./Optimizer');
const { getAuditItems } = require('../utils/helper');

class HTMLOptimizer extends Optimizer {
  static refine(artifacts, audits) {
    const externalLinks = getAuditItems(audits, 'external-anchors-use-rel-noopener').map(
      item => item.href
    );
    const preConnectUrls = getAuditItems(audits, 'uses-rel-preconnect').map(item => item.url);
    return {
      externalLinks,
      preConnectUrls,
    };
  }

  static async optimize($, artifacts, audits) {
    const { externalLinks, preConnectUrls } = this.refine(artifacts, audits);
    if (externalLinks) {
      externalLinks.forEach(link => {
        $(`a[href="${link}"]`).attr('rel', 'noreferrer');
      });
    }
    if (preConnectUrls) {
      preConnectUrls.forEach(url => {
        $('head').append(`<link rel="preconnect" href="${url}">`);
      });
    }
  }
}

module.exports = HTMLOptimizer;
