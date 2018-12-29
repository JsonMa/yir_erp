'use strict';

const Service = require('../lib/DBService');

class MaterialOutService extends Service {
  constructor(ctx) {
    super(ctx, 'MaterialOut');
  }
}

module.exports = MaterialOutService;

