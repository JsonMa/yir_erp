'use strict';

const { Controller } = require('egg');
const VError = require('verror');

class RelationshipController extends Controller {
  get createRule() {
    return {
      properties: {
        device_id: {
          $ref: 'schema.definition#/oid',
        },
        tel: {
          $ref: 'schema.definition#/mobile',
        },
        reshare: {
          type: 'boolean',
          default: false,
        },
        share_token: {
          type: 'string',
        },
      },
      maxProperties: 3,
      minProperties: 1,
      $async: true,
      additionalProperties: false,
    };
  }

  async create() {
    this.ctx.authPermission();
    const { ctx, app, createRule } = this;
    const { EBADREQUEST } = app.errors;
    const { device_id: deviceId, tel, share_token: token, reshare = false } = ctx.request.body;

    // 权限&参数校验
    await ctx.verify(createRule, ctx.request.body);
    if (deviceId) {
      ctx.assert(tel, new VError({
        name: EBADREQUEST,
        info: ctx.request.body,
      }, '分享设备必传参数[tel, device_id]'));
    }

    const relationInfo = { type: 'PRODUCTION' };

    // 通过扫码分享设备
    if (token) {
      const tokenInfo = await ctx.service.relationship.tokenVerify(token);
      Object.assign(relationInfo, tokenInfo, { user_id: ctx.auth.account_id });
    }

    // 通过添加用户方式分享设备
    if (tel && deviceId) {
      const userInfo = await ctx.service.relationship.userVerify(tel, deviceId, reshare);

      Object.assign(relationInfo, {
        device_id: deviceId,
        user_id: userInfo.user_id,
        owner_id: userInfo.owner_id,
      });
    }

    // 添加 mqtt topic 权限
    ctx.logger.info('分享设备，创建relationship：%j', relationInfo);
    const relationship = await ctx.service.relationship.create(relationInfo);
    if (reshare === false) {
      const owner = await ctx.service.accountApp.findOne({ account_id: relationship.owner_id });
      await this.ctx.service.notification.send({
        recipients: [ relationship.user_id ],
        subject: '分享设备',
        content: `你好，你收到[${owner.nickname}]用户分享的一个设备，立刻去体验使用吧!`,
        type: 'SYSTEM',
      });
    } else {
      const user = await ctx.service.account.findOne({ account_id: relationship.user_id });
      const share = await ctx.service.account.findOne({ account_id: ctx.auth.account_id });
      const device = await ctx.service.device.findById(relationship.device_id)
        .catch(err => {
          ctx.error(!err, '相应设备不存在');
        });
      const product = await ctx.service.product.findById(device.product_id)
        .catch(err => {
          ctx.error(!err, '相应产品不存在');
        });
      await this.ctx.service.notification.send({
        recipients: [ relationship.owner_id ],
        subject: '子账户分享设备',
        content: `你好，[${share.nickname}]用户将[${product.name}]设备分享给了[${user.nickname}]用户!`,
        type: 'SYSTEM',
      });
      await this.ctx.service.notification.send({
        recipients: [ relationship.user_id ],
        subject: '分享设备',
        content: `你好，你收到[${share.nickname}]用户分享的一个设备，立刻去体验使用吧!`,
        type: 'SYSTEM',
      });
    }

    ctx.jsonBody = { data: relationship };
  }

  async destroy() {
    this.ctx.authPermission();
    const { ctx, service } = this;
    const { id } = ctx.params;
    await ctx.verify('schema.id', ctx.params);

    const relationship = await service.relationship.findById(id)
      .catch(err => {
        ctx.assert(!err, 404);
      });
    ctx.error(relationship.user_id, '此relationship为设备绑定关系');
    ctx.assert(relationship.owner_id.toString() === ctx.auth.account_id.toString() ||
      relationship.user_id.toString() === ctx.auth.account_id.toString(), 403);

    await service.relationship.destroy({
      _id: id,
    });
    await service.connectionAuth.destroyAuth(id, relationship.user_id);

    ctx.jsonBody = { data: relationship };
  }
}

module.exports = RelationshipController;
