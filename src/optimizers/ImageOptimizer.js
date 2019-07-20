'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const Optimizer = require('./Optimizer');
const logger = require('../utils/logger');
const {
  toUrlFromPath,
  isSameSite,
  toMapByKey,
  toFullPathUrl,
  getAuditItems,
} = require('../utils/helper');

const { URL } = url;

/**
 * Optimize Strategy
 * 1. Ignore all images from a third server
 * 2. Make use of lazyload
 * 3. Transform to webp
 * 4. Resize image based on max size
 * 5. Reduce image
 */
class ImageOptimizer extends Optimizer {
  static get meta() {
    return {
      requiredArtifacts: ['ImageElements', 'URL'],
    };
  }

  /**
   * Extract useful data from raw artifacts
   * @param artifacts
   * @param audits
   * @returns {Array}
   */
  static refine(artifacts, audits) {
    const pageUrl = artifacts.URL.finalUrl;
    const imageElementsGroupBySrc = _.groupBy(artifacts.ImageElements, 'src');
    const images = [];
    const offScreenImageUrls = getAuditItems(audits, 'offscreen-images').map(item => item.url);
    const webpImageUrls = getAuditItems(audits, 'uses-webp-images').map(item => item.url);
    _.each(imageElementsGroupBySrc, imageElements => {
      // A certain image might appear in a few elements, Sadly we're not able to get the xpath information.
      // We have to be conservative as soon as possible.
      // We have to ignore imageElements which's using as CSS background or has `object-fit` property.
      const hasBeenUsedInCss = imageElements.some(image => image.isCss);
      const usesObjectFit = imageElements.some(image => image.usesObjectFit);
      const resizable = !hasBeenUsedInCss && !usesObjectFit;
      const displayedMaxWidth = _.maxBy(_.map(imageElements, 'displayedWidth'));
      const displayedMaxHeight = _.maxBy(_.map(imageElements, 'displayedHeight'));
      const resize = this.computeResize(
        displayedMaxWidth,
        displayedMaxHeight,
        imageElements[0].naturalWidth,
        imageElements[0].naturalHeight
      );
      const { src } = imageElements[0];
      const combinedImage = {
        src,
        isFromSameSite: isSameSite(pageUrl, src),
        isOffScreen: offScreenImageUrls.includes(src),
        shouldUseWep: webpImageUrls.includes(src),
        resizable,
        resize,
      };
      images.push(combinedImage);
    });
    return images.filter(image => image.src);
  }

  static computeResize(displayedMaxWidth, displayedMaxHeight, naturalWidth, naturalHeight) {
    if (!(displayedMaxWidth < naturalWidth && displayedMaxHeight < naturalHeight)) {
      return {
        width: naturalWidth,
        height: naturalHeight,
      };
    }
    const ratio = naturalWidth / naturalHeight;
    if (displayedMaxWidth >= displayedMaxHeight * ratio) {
      return {
        width: displayedMaxWidth,
        height: displayedMaxWidth / ratio,
      };
    }
    return {
      width: displayedMaxHeight * ratio,
      height: displayedMaxHeight,
    };
  }

  /**
   * Optimize image based on the collected data.
   * No matter an image is optimized or not, optimizedUrl url will be attached.
   * @param image
   * @param context
   * @returns {Promise<{optimizedUrl: *}>}
   */
  static async optimizeImage(image, context) {
    let optimizedUrl = image.src;
    if (image.isFromSameSite) {
      const { pathname } = new URL(image.src);
      const srcPath = path.resolve(context.srcDir, `.${pathname}`);
      const destPath = path.resolve(context.destDir, `.${pathname}`);
      optimizedUrl = pathname;
      if (image.shouldUseWep) {
        const files = await imagemin([srcPath], {
          destination: path.dirname(destPath),
          plugins: [imageminWebp({ resize: image.resize, quality: 100 })],
        });
        if (files[0]) {
          optimizedUrl = toUrlFromPath(context.destDir, files[0].destinationPath);
        }
      } else {
        const data = await fs.readFile(srcPath);
        await fs.outputFile(destPath, data);
      }
    }
    return {
      ...image,
      optimizedUrl,
    };
  }

  static applyOptimizedImage($element, image) {
    $element.attr('src', image.optimizedUrl);
    if (image.isOffScreen) {
      $element.removeAttr('src');
      $element.attr('data-src', image.optimizedUrl);
    }
  }

  // The gzip size of this script is 2.2K. Now we could simply say it always deserve.
  static ensureLazyLoadImageScript($) {
    const lazyLoadUrl = 'https://cdn.jsdelivr.net/npm/vanilla-lazyload@12.0.0/dist/lazyload.min.js';
    if ($(`script[src="${lazyLoadUrl}"]`).length === 0) {
      $('body').append(`
        <script src="${lazyLoadUrl}"></script>
        <script>
          var lazyLoadInstance = new LazyLoad({
          });
         </script>
      `);
    }
  }

  static async optimize($, artifacts, audits, context) {
    const images = await Promise.all(
      this.refine(artifacts, audits).map(image => this.optimizeImage(image, context))
    );
    const imageMapByUrl = toMapByKey(images, 'src');
    const pageUrl = artifacts.URL.finalUrl;
    $('img[src]').each((i, element) => {
      const imageUrl = toFullPathUrl(pageUrl, $(element).attr('src'));
      const image = imageMapByUrl.get(imageUrl);
      if (image) {
        this.applyOptimizedImage($(element), image);
      } else {
        logger.warn(`Lack information of image which url is ${imageUrl}`);
      }
    });
    if (images.some(image => image.isOffScreen)) {
      this.ensureLazyLoadImageScript($);
    }
  }
}

module.exports = ImageOptimizer;
