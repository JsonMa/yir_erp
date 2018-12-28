'use strict';

const Service = require('../lib/DBService');

class FileService extends Service {
  constructor(ctx) {
    super(ctx, 'File');
  }
}

module.exports = FileService;
