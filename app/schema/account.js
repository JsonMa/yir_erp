'use strict';

module.exports = {
  properties: {
    id: {
      $ref: 'schema.definition#/oid',
    },
    name: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
    role: {
      type: 'string',
      enum: [ 'KUGUAN', 'CAIWU', 'CHUNA', 'CAIGOU', 'ZHIJIAN', 'NORMAL', 'ADMIN' ],
    },
    nick_name: {
      type: 'string',
    },
    email: {
      $ref: 'schema.definition#/email',
    },
    avator: {
      $ref: 'schema.definition#/oid',
    },
    department: {
      $ref: 'schema.definition#/oid',
    },
    tel: {
      type: 'string',
    },
    addr: {
      type: 'string',
    },
    entry_time: {
      type: 'string',
    },
    leave_time: {
      type: 'string',
    },
    state: {
      type: 'string',
      enum: [ 'EXIST', 'LEAVE' ],
    },
    gender: {
      type: 'string',
      enum: [ 'MALE', 'FEMAL' ],
    },
    id_number: {
      type: 'string',
    },
    bank: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        id: {
          type: 'string',
        },
      },
      $async: true,
      additionalProperties: false,
    },
    enable: {
      type: 'boolean',
    },
  },
  $async: true,
  additionalProperties: false,
};
