'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const UglifyJS = require('uglify-es');
const pacote = require('pacote');
const semver = require('semver');
const Optimizer = require('./Optimizer');
const logger = require('../utils/logger');
const { calcHash, findAvailableUrlByHash } = require('../utils/cdn');
const { isSameSite, toMapByKey, toFullPathUrl, getAuditItems } = require('../utils/helper');

const getLatestVersion = async (npm, version) => {
  const { versions } = await pacote.packument(npm);
  return semver.maxSatisfying(Object.keys(versions), `^${version}`);
};

const getCdnUrl = (npm, version) => {
  switch (npm) {
    case 'jquery':
      return `https://cdn.jsdelivr.net/npm/jquery@${version}/dist/jquery.min.js`;
    case 'moment':
      return `https://cdn.jsdelivr.net/npm/moment@${version}/min/moment-with-locales.min.js`;
    case 'bootstrap':
      return `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/js/bootstrap.min.js`;
    default:
      throw new Error(`Failed to find ${npm}, please add this package.`);
  }
};

const { URL } = url;

class ScriptOptimizer extends Optimizer {
  static get meta() {
    return {
      requiredArtifacts: ['ScriptElements', 'URL'],
    };
  }

  static detectScriptUrlByLib(lib, scriptUrls) {
    let matchedScript = scriptUrls.find(scriptUrl =>
      new RegExp(`${lib.name}@${lib.version}`, 'i').test(scriptUrl)
    );
    if (!matchedScript) {
      matchedScript = scriptUrls.find(scriptUrl => new RegExp(`${lib.name}`, 'i').test(scriptUrl));
    }
    return matchedScript;
  }

  static refine(artifacts, audits) {
    const pageUrl = artifacts.URL.finalUrl;
    const jsLibs = getAuditItems(audits, 'js-libraries');
    const scriptUrls = getAuditItems(audits, 'network-requests')
      .filter(script => script.resourceType === 'Script')
      .map(script => script.url);
    const vulnerableLibs = getAuditItems(audits, 'no-vulnerable-libraries').map(
      item => item.detectedLib.text
    );
    const jsLibsWithScript = jsLibs.map(lib => {
      return {
        npm: lib.npm,
        version: lib.version,
        isVulnerable: vulnerableLibs.includes(`${lib.name}@${lib.version}`),
        matchedScript: this.detectScriptUrlByLib(lib, scriptUrls),
      };
    });

    const scriptMapByUrl = toMapByKey(artifacts.ScriptElements, 'src');

    return scriptUrls.map(scriptUrl => {
      const lib = jsLibsWithScript.find(({ matchedScript }) => matchedScript === scriptUrl);
      return {
        src: scriptUrl,
        isFromSameSite: isSameSite(pageUrl, scriptUrl),
        shouldMinify: true,
        lib,
        content: scriptMapByUrl.get(scriptUrl).content,
      };
    });
  }

  static async optimizeScript(script, context) {
    if (script.lib && script.lib.isVulnerable) {
      const latestVersion = await getLatestVersion(script.lib.npm, script.lib.version);
      return {
        ...script,
        optimizedUrl: getCdnUrl(script.lib.npm, latestVersion),
      };
    }
    if (!script.isFromSameSite) {
      return {
        ...script,
        optimizedUrl: script.src,
      };
    }
    if (script.content) {
      const hashHex = calcHash(script.content);
      const optimizedUrl = await findAvailableUrlByHash(hashHex);
      if (optimizedUrl) {
        return {
          ...script,
          optimizedUrl,
        };
      }
    }
    const scriptUrl = new URL(script.src);
    if (script.shouldMinify) {
      const result = UglifyJS.minify(script.content);
      if (!result.error) {
        const absolutePath = scriptUrl.pathname;
        const destPath = path.resolve(context.destDir, `.${absolutePath}`);
        await fs.outputFile(destPath, result.code);
      }
    }
    return { optimizedUrl: scriptUrl.pathname, ...script };
  }

  static applyOptimizedScript($element, script) {
    $element.attr('src', script.optimizedUrl);
  }

  static async optimize($, artifacts, audits, context) {
    const scripts = await Promise.all(
      this.refine(artifacts, audits).map(script => this.optimizeScript(script, context))
    );
    const scriptMapByUrl = toMapByKey(scripts, 'src');
    const pageUrl = artifacts.URL.finalUrl;
    $('script[src]').each((i, element) => {
      const scriptUrl = toFullPathUrl(pageUrl, $(element).attr('src'));
      const script = scriptMapByUrl.get(scriptUrl);
      if (script) {
        this.applyOptimizedScript($(element), script);
      } else {
        logger.warn(`Lack information of script which url is ${scriptUrl}.`);
      }
    });
  }
}

module.exports = ScriptOptimizer;
