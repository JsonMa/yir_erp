'use strict';

const Service = require('../lib/DBService');

class MaterialService extends Service {
  constructor(ctx) {
    super(ctx, 'Material');
  }
}

module.exports = MaterialService;
