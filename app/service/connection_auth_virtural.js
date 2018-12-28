'use strict';

const Service = require('../lib/DBService');
const utils = require('utility');

class ConnectionAuthVirturalService extends Service {
  constructor(ctx) {
    super(ctx, 'ConnectionAuthVirtural');
  }

  async createAuth(productId) {
    const { ctx } = this;

    ctx.assert(productId, '产品ID不能为空');

    const deviceSn = `debug_${productId}`;
    const samples = new Array(26).fill(97).map((item, i) => String.fromCharCode(item + i));

    const authInfo = await ctx.model.ConnectionAuthVirtural.findOne({
      username: deviceSn,
    });

    if (!authInfo) {
      await ctx.model.ConnectionAuthVirtural.create({
        username: deviceSn,
        password: utils.randomString(16, samples),
        expired_at: Date.now() + 20 * 365 * 24 * 3600 * 1000,
        publish_acl: [
          { pattern: `client/products/${productId}/debug/${deviceSn}/status/+` },
        ],
        subscribe_acl: [
          { pattern: `client/products/${productId}/debug/${deviceSn}/command/+` },
          { pattern: `client/products/${productId}/debug/${deviceSn}/status/+` },
        ],
      });
    }
  }
}

module.exports = ConnectionAuthVirturalService;
