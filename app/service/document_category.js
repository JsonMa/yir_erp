'use strict';

const Service = require('../lib/DBService');

class DocumentCategoryService extends Service {
  constructor(ctx) {
    super(ctx, 'DocumentCategory');
  }
}

module.exports = DocumentCategoryService;
