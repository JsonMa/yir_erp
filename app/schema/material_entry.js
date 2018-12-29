// 入库单
'use strict';

module.exports = {
  properties: {
    no: {
      type: 'number',
    },
    material: {
      $ref: 'schema.definition#/oid',
    },
    application_count: {
      type: 'number',
    },
    real_count: {
      type: 'number',
    },
    per_price: {
      type: 'number',
    },
    total_price: {
      type: 'number',
    },
    unit: {
      type: 'string',
    },
    buyer: {
      $ref: 'schema.definition#/oid',
    },
    remark: {
      type: 'string',
    },
    sender: {
      type: 'string',
    },
    reviewer: {
      $ref: 'schema.definition#/oid',
    },
    inspector: {
      $ref: 'schema.definition#/oid',
    },
    quality_result: {
      type: 'boolean',
    },
    purchase_method: {
      type: 'string',
      enum: [ 'CASH', 'BANK', 'WECHAT', 'ALIPAY' ],
    },
  },
  $async: true,
  additionalProperties: false,
};

