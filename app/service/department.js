'use strict';

const Service = require('../lib/DBService');

class DepartmentService extends Service {
  constructor(ctx) {
    super(ctx, 'Department');
  }
}

module.exports = DepartmentService;
