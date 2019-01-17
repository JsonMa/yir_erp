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
    buyer: {
      $ref: 'schema.definition#/oid',
    },
    maker: {
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
      type: 'string',
      enum: [ 'PASSED', 'REJECTED', 'PART' ],
    },
    purchase_method: {
      type: 'string',
      enum: [ 'CASH', 'BANK', 'WECHAT', 'ALIPAY' ],
    },
    status: {
      type: 'string',
      enum: [ 'UNREVIEW', 'PASSED', 'REJECTED', 'REACTIVATED' ],
    },
  },
  $async: true,
  additionalProperties: false,
};
