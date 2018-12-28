'use strict';
module.exports = {
  properties: {
    no: {
      $ref: 'schema.definition#/oid',
    },
    name: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
    specific: {
      type: 'string',
    }, // 50*2.62
    image: {
      type: 'string',
    },
    remark: {
      type: 'string',
    },
    category: {
      $ref: 'schema.definition#/oid',
    },
    enable: {
      type: 'boolean',
    },
  },
  $async: true,
  additionalProperties: false,
};
