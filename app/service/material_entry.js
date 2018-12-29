'use strict';

const Service = require('../lib/DBService');

class MaterialEntryService extends Service {
  constructor(ctx) {
    super(ctx, 'MaterialEntry');
  }
}

module.exports = MaterialEntryService;
