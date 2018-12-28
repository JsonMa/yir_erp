'use strict';

module.exports = {
  properties: {
    offset: {
      type: 'string',
      pattern: '\\d+',
      min: 0,
      default: 0,
    },
    limit: {
      type: 'string',
      pattern: '\\d+',
      min: 1,
      max: 100,
      default: 1,
    },
    sort: {
      type: 'string',
      default: 'ACS',
      enum: [ 'created_at', 'updated_at', '-created_at', '-updated_at' ],
    },
  },
  $async: true,
};
