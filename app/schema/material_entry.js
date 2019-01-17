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
      type: 'string',
    },
    real_count: {
      type: 'string',
    },
    per_price: {
      type: 'string',
    },
    total_price: {
      type: 'string',
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
