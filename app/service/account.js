'use strict';

const Service = require('../lib/DBService');

class AccountService extends Service {
  constructor(ctx) {
    super(ctx, 'Account');
  }
}

module.exports = AccountService;
