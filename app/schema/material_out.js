'use strict';

module.exports = {
  properties: {
    no: {
      $ref: 'schema.definition#/oid',
    },
    materials: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          material: {
            $ref: 'schema.definition#/oid',
          },
          count: {
            type: 'string',
          },
          remark: {
            type: 'string',
          },
          order: {
            type: 'string',
          },
        },
      },
    },
    reason: {
      type: 'string',
    },
    total_count: {
      type: 'number',
    },
    maker: {
      $ref: 'schema.definition#/oid',
    },
    applicant: {
      $ref: 'schema.definition#/oid',
    },
    reviewer: {
      $ref: 'schema.definition#/oid',
    },
    status: {
      type: 'string',
      enum: [ 'UNREVIEW', 'REACTIVATED', 'PASSED', 'REJECTED' ],
    },
  },
  $async: true,
  additionalProperties: false,
};
