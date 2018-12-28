'use strict';

module.exports = {
  properties: {
    id: {
      $ref: 'schema.definition#/oid',
    },
  },
  $async: true,
  required: [ 'id' ],
  additionalProperties: false,
};
