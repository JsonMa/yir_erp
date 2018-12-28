'use strict';

const Service = require('../lib/DBService');

class ExpressService extends Service {
  constructor(ctx) {
    super(ctx, 'Express');
  }
}

module.exports = ExpressService;
