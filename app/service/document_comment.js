'use strict';

const Service = require('../lib/DBService');

class DocumentCommentService extends Service {
  constructor(ctx) {
    super(ctx, 'DocumentComment');
  }
}

module.exports = DocumentCommentService;
