'use strict';

module.exports = {
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
          type: 'number',
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
  $async: true,
  additionalProperties: false,
};
