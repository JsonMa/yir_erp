'use strict';

const is = require('is');
const assert = require('assert');

module.exports = {
  generateSortParam(sort) {
    assert(is.string(sort));
    const param = {};

    const sorts = sort.split(',');
    for (const s of sorts) {
      if (s.startsWith('-')) {
        param[s.substr(1, s.length - 1)] = -1;
      } else {
        param[s] = 1;
      }
    }
    return param;
  },
};
