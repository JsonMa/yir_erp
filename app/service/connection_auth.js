'use strict';

const Service = require('../lib/DBService');

class ConnectionAuthService extends Service {
  constructor(ctx) {
    super(ctx, 'ConnectionAuth');
  }

  async createAuth(relationship) {
    const { ctx, service } = this;

    const originRelationship = await service.relationship.findOne({
      owner_id: relationship.owner_id,
      device_id: relationship.device_id,
      user_id: null,
    });
    ctx.error(originRelationship, `设备[${relationship.device_id}]无绑定信息`);

    const orignConnectionAuth = await ctx.model.ConnectionAuthH5.findOne({
      username: originRelationship._id,
      password: relationship.owner_id,
    }, { publish_acl: 1, subscribe_acl: 1, _id: 1 }, { lean: true });
    ctx.error(orignConnectionAuth, '未找到绑定设备的原始权限', { relationship });

    const isExist = await this.findOne({
      username: relationship._id,
      password: relationship.user_id,
    });
    ctx.error(!isExist, 'connectionAuth已存在', { connectionAuth: isExist });
    await ctx.model.ConnectionAuthH5.create({
      publish_acl: orignConnectionAuth.publish_acl,
      subscribe_acl: orignConnectionAuth.subscribe_acl,
      ref: orignConnectionAuth._id,
      username: relationship._id,
      password: relationship.user_id,
    });
  }

  async destroyAuth(username, password) {
    const connectionAuth = await this.ctx.model.ConnectionAuthH5.findOne({ username, password });
    if (!connectionAuth) return;
    // 删除权限(如果为设备绑定的权限,要删除关联分享出去的权限)
    await this.destroy({
      $or: [{ username, password }, { ref: connectionAuth._id }],
    }, false, true);
  }
}

module.exports = ConnectionAuthService;
