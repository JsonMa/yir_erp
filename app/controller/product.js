'use strict';

const { Controller } = require('egg');
const _ = require('underscore');

class NotificationController extends Controller {
  get updateRule() {
    return {
      properties: {
        id: {
          $ref: 'schema.definition#/oid',
        },
        read: {
          type: 'boolean',
        },
        action: {
          type: 'string',
          enum: [ 'read' ],
        },
      },
      $async: true,
      required: [ 'id', 'action' ],
      additionalProperties: false,
    };
  }

  async create() {
    const { body } = this.ctx.request;
    const { service } = this.ctx;
    service.xss.xssFilter(body);

    await this.ctx.verify('schema.notification', body);

    let notifications = await service.notification.send(body);
    if (body.recipients[0].length !== 24) notifications = [ notifications[0] ]; // 收件人是ALL/APP/SAAS时

    this.ctx.jsonBody = {
      data: notifications,
    };
  }

  get listRule() {
    return {
      $async: true,
      $merge: {
        source: {
          $ref: 'schema.pagination#',
        },
        with: {
          properties: {
            keyword: {
              type: 'string',
            },
          },
          required: [],
        },
      },
    };
  }

  async index() {
    const { ctx } = this;
    const { service } = ctx;
    const { query } = ctx.request;
    const { limit = 10, offset = 0, sort = '-created_at' } = query;
    const { generateSortParam } = ctx.helper.pagination;

    await this.ctx.verify(this.listRule, query);

    const filter = {
      recipient: { $in: [ 'ALL', 'APP', 'SAAS' ] },
    };
    if (query.keyword) {
      filter.$or = [
        { subject: { $regex: query.keyword } },
      ];
    }
    let notifications = await service.notification.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort) });

    if (!_.isEmpty(notifications)) {
      // 增加发件人信息, 这里仅限发件人为admin用户的
      const sender = _.pluck(notifications, 'sender');
      let account = await service.account.findMany({ _id: { $in: sender } });
      let admin = await service.accountAdmin.findMany({ account_id: { $in: sender } });

      account = _.indexBy(account, '_id');
      admin = _.indexBy(admin, 'account_id');

      notifications = notifications.map(function(not) {
        not = not.toObject();
        not.senderName = admin[not.sender] ? admin[not.sender].name : '';
        not.senderTel = account[not.sender] ? account[not.sender].tel : '';

        return not;
      });
    }

    this.ctx.jsonBody = {
      meta: {
        count: await service.notification.count(filter),
      },
      data: notifications,
    };
  }

  async get() {
    this.ctx.authPermission();
    const { ctx } = this;
    const { params, service } = ctx;
    const { query } = ctx.request;

    await ctx.verify('schema.id', params);
    const notification = await service.notification.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });
    if (!notification.read) {
      await service.notification.update({ _id: params.id }, { read: true });
      notification.read = true;
    }

    const embedQuery = query.embed || '';
    const embed = {
      user: {},
      file: !~embedQuery.indexOf('file') ? {} : await service.file.findOne({ _id: notification.attachment }), // eslint-disable-line
    };

    if (~embedQuery.indexOf('user')) { // eslint-disable-line
      const accountAdmin = await service.accountAdmin.findOne({ account_id: notification.sender });
      const account = await service.account.findById(accountAdmin.account_id);
      embed.user = Object.assign(accountAdmin.toJSON(), {
        type: account.type,
      });
    }

    this.ctx.jsonBody = {
      embed,
      data: notification,
    };
  }

  async update() {
    this.ctx.authPermission();
    const { ctx, updateRule } = this;
    const { query, body } = ctx.request;
    const { params, service } = ctx;
    service.xss.xssFilter(body);

    await this.ctx.verify(updateRule, Object.assign({}, query, params, body));

    const notification = await service.notification.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    if (query.action === 'read') {
      const readNotification = {
        read: body.read,
      };
      await service.notification.update({ _id: params.id }, readNotification);
      Object.assign(notification, readNotification);
    }

    this.ctx.jsonBody = {
      data: notification,
    };
  }

  async delete() {
    this.ctx.authPermission();
    const { ctx } = this;
    const { params, service } = ctx;

    await ctx.verify('schema.id', params);
    const notification = await service.notification.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.notification.destroy({ _id: params.id });

    this.ctx.body = {
      data: notification,
    };
  }

  async withdrawNotification() {
    this.ctx.adminPermission();
    const { ctx } = this;
    const { params, service } = ctx;

    await ctx.verify('schema.id', params);

    const baseNot = await service.notification.findOne({ _id: params.id, base_id: { $exists: false } });
    ctx.error(baseNot, `没有找到要撤回的消息,ID:[${params.id}]`);

    const condition = { base_id: params.id };

    const withdrawCount = await service.notification.count(condition);

    // 撤回及删除
    await service.notification.destroy(condition);

    baseNot.withdraw = true;

    baseNot.save();

    this.ctx.body = {
      count: withdrawCount,
      data: baseNot,
    };
  }
}

module.exports = NotificationController;
