'use strict';

const {
  Controller,
} = require('egg');
const crypto = require('crypto');


/**
 * Auth 类
 *
 * @class AuthController
 * @extends {Controller}
 */
class AuthController extends Controller {
  get loginRule() {
    return {
      properties: {
        username: {
          $ref: 'schema.definition#/str',
        },
        password: {
          $ref: 'schema.definition#/password',
        },
        token: {
          $ref: 'schema.definition#/text',
        },
      },
      $async: true,
      additionalProperties: false,
    };
  }

  async login() {
    const {
      ctx,
    } = this;
    const {
      body,
    } = this.ctx.request;
    const {
      service,
    } = this.ctx;
    await ctx.verify(this.loginRule, body);

    let account = null;
    const filter = {
      password: crypto.createHash('sha1').update(body.password).digest('hex'),
      $or: [{
        nick_name: body.username,
      },
      {
        tel: body.username,
      },
      ],
    };

    account = await service.account.findOne(filter);
    ctx.assert(account, 400);

    account = Object.assign(Object.assign({
      roleName: ctx.roleConvert(account.role),
    }, account.toJSON()));
    const token = await service.account.cookieSet(account);

    ctx.jsonBody = {
      meta: {
        token,
      },
      data: account,
    };
  }

  async logout() {
    const {
      ctx,
      service,
    } = this;

    await service.account.clearCookiesAndToken();

    ctx.jsonBody = {
      data: {
        code: 200,
        msg: 'success',
      },
    };
  }
}

module.exports = AuthController;
