'use strict';

const Service = require('../lib/DBService');
const moment = require('moment');
const utils = require('utility');

class ConnectionService extends Service {
  constructor(ctx) {
    super(ctx, 'Connection');
  }

  async createConnection(body) {
    const { ctx, service } = this;

    // 产品校验
    const product = await service.product.findOne({
      id: body.product_id,
    });
    ctx.error(product, `Id (${body.product_id}) 对应产品不存在`);
    ctx.error(product.permission.debugging, '该产品尚未开启调试权限');

    const samples = new Array(26).fill(97).map((item, i) => String.fromCharCode(item + i));
    const connection = await service.connection.create({
      user_id: ctx.auth.account_id,
      expired_at: moment().add(1, 'hours'),
      type: body.type,
      id: utils.randomString(4, samples),
      binding_token: utils.randomString(4, samples),
      product_id: body.product_id,
    });

    await service.connectionAuth.create({
      username: connection.id,
      password: connection.binding_token,
      expired_at: moment().add(1, 'hours'),
      publish_acl: [
        { pattern: 'device/products/+/devices/+/+' },
      ],
      subscribe_acl: [
        { pattern: `client/connections/${connection.id}/devices` },
      ],
    });

    return connection;
  }
}

module.exports = ConnectionService;
