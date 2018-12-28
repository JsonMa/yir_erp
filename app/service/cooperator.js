'use strict';

const Service = require('../lib/DBService');

class CooperatorService extends Service {
  constructor(ctx) {
    super(ctx, 'Cooperator');
  }
}

module.exports = CooperatorService;
