// 出库单
'use strict';
module.exports = {
  properties: {
    no: {
      $ref: 'schema.definition#/oid',
    },
    products: {
      type: 'array',
      item: {
        type: 'object',
        properties: {
          product: {
            $ref: 'schema.definition#/oid',
          },
          count: {
            type: 'number',
          },
          remark: {
            type: 'string',
          },
        },
        $async: true,
        additionalProperties: false,
      },
    },
    total_count: {
      type: 'number',
    },
    maker: {
      $ref: 'schema.definition#/oid',
    },
    reviewer: {
      $ref: 'schema.definition#/oid',
    },
  },
  $async: true,
  additionalProperties: false,
};
