'use strict';

const Service = require('../lib/DBService');

class DocumentService extends Service {
  constructor(ctx) {
    super(ctx, 'DevelopDocument');
  }
}

module.exports = DocumentService;
