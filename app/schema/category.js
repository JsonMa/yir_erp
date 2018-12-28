'use strict';

module.exports = {
  properties: {
    no: {
      type: 'string',
    },
    parent: {
      $ref: 'schema.definition#/oid',
    },
    name: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    type: {
      type: 'string',
      enum: [ 'MATERIAL', 'PRODUCT' ],
    },
    stage: {
      type: 'number',
      enum: [ 1, 2, 3, 4 ],
    },
    enable: {
      type: 'boolean',
    },
  },
  $async: true,
  additionalProperties: false,
};
