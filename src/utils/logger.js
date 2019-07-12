'use strict';

const warn = (...arg) => {
  console.warn(...arg);
};

const log = (...arg) => {
  console.log(...arg);
};

module.exports = {
  warn,
  log,
};
