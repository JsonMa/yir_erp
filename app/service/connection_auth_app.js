'use strict';

const Service = require('../lib/DBService');

class ConnectionAuthAppService extends Service {
  constructor(ctx) {
    super(ctx, 'ConnectionAuthApp');
  }
}

module.exports = ConnectionAuthAppService;
