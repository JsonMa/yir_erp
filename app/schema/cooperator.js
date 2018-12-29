'use strict';

module.exports = {
  properties: {
    name: {
      type: 'string',
    },
    logo: {
      type: 'string',
    },
    introduce: {
      type: 'string',
    },
    label: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    addr: {
      type: 'string',
    },
    contact: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        tel: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
      },
    },
    type: {
      type: 'string',
      enum: [ 'SUPPLIER', 'PURCHASER', 'BOTH' ],
    },
    enable: {
      type: 'boolean',
    },
  },
  $async: true,
  additionalProperties: false,
};
