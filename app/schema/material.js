'use strict';

module.exports = {
  properties: {
    no: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
    specific: {
      type: 'string',
    },
    supplier: {
      $ref: 'schema.definition#/oid',
    },
    category: {
      $ref: 'schema.definition#/oid',
    },
    marked_price: {
      type: 'number',
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
    unit: {
      type: 'string',
    },
  },
  $async: true,
  additionalProperties: false,
};
