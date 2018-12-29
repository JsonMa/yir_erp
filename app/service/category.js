'use strict';

const Service = require('../lib/DBService');

class CategoryService extends Service {
  constructor(ctx) {
    super(ctx, 'Category');
  }
}

module.exports = CategoryService;
