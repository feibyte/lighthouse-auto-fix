'use strict';

class Optimizer {
  static optimize() {
    throw new Error('optimize() method must be overridden');
  }
}

module.exports = Optimizer;
