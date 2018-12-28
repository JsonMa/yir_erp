'use strict';

module.exports = {
  properties: {
    name: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    remark: {
      type: 'string',
    },
    enable: {
      type: 'boolean',
    },
  },
  $async: true,
  additionalProperties: false,
};
