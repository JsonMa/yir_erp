'use strict';

const Service = require('../lib/DBService');

class ConnectionAuthH5Service extends Service {
  constructor(ctx) {
    super(ctx, 'ConnectionAuthH5');
  }
}

module.exports = ConnectionAuthH5Service;
