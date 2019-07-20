'use strict';

const ImageOptimizer = require('../src/optimizers/ImageOptimizer');

describe('computeResize()', () => {
  const naturalWidth = 100;
  const naturalHeight = 200;
  it('should return the original size even when display width is not smaller than the original', () => {
    const displayedMaxWidth = 300;
    const displayedMaxHeight = 30;
    const resize = ImageOptimizer.computeResize(
      displayedMaxWidth,
      displayedMaxHeight,
      naturalWidth,
      naturalHeight
    );
    expect(resize.width).toBe(naturalWidth);
    expect(resize.height).toBe(naturalHeight);
  });

  it('should return the original size even when display height is not smaller than the original', () => {
    const displayedMaxWidth = 30;
    const displayedMaxHeight = 300;
    const resize = ImageOptimizer.computeResize(
      displayedMaxWidth,
      displayedMaxHeight,
      naturalWidth,
      naturalHeight
    );
    expect(resize.width).toBe(naturalWidth);
    expect(resize.height).toBe(naturalHeight);
  });

  it('should choose width as metric and keep the ratio when both sides are smaller and width is relatively larger', () => {
    const displayedMaxWidth = 50;
    const displayedMaxHeight = 80;
    const resize = ImageOptimizer.computeResize(
      displayedMaxWidth,
      displayedMaxHeight,
      naturalWidth,
      naturalHeight
    );
    expect(resize.width).toBe(displayedMaxWidth);
    expect(resize.height).toBe(100);
  });

  it('should choose height as metric and keep the ratio when both sides are smaller and height is relatively larger', () => {
    const displayedMaxWidth = 30;
    const displayedMaxHeight = 100;
    const resize = ImageOptimizer.computeResize(
      displayedMaxWidth,
      displayedMaxHeight,
      naturalWidth,
      naturalHeight
    );
    expect(resize.width).toBe(50);
    expect(resize.height).toBe(displayedMaxHeight);
  });
});
