'use strict';

const warn = (...arg) => {
  console.warn(...arg);
};

const log = (...arg) => {
  console.log(...arg);
};

const error = (...arg) => {
  console.error(...arg);
};

module.exports = {
  warn,
  log,
  error,
};
