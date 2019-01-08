'use strict';

const {
  Controller,
} = require('egg');
const VError = require('verror');
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
    const {
      EAPPLICATION,
    } = this.app.errors;
    await ctx.verify(this.loginRule, body);

    let account = null;

    try {
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
      ctx.assert(account, 404);
    } catch (err) {
      throw new VError({
        name: EAPPLICATION,
        info: {
          body,
        },
      }, err.message || '账号或密码错误');
    }

    const token = await service.account.cookieSet(Object.assign({},
      account.toJSON()
    ));

    ctx.body = {
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

    ctx.body = {
      code: 200,
      msg: 'success',
    };
  }

  get accountRule() {
    return {
      properties: {
        name: {
          $ref: 'schema.definition#/str',
        },
      },
      $async: true,
      required: [ 'name' ],
      additionalProperties: false,
    };
  }

  async accountUnlock() {
    const {
      app,
      ctx,
    } = this;
    const {
      AUTHTIME,
    } = app.redisPrefix;
    await ctx.verify(this.accountRule, ctx.query);
    const time = await app.redis.get(`${AUTHTIME}-${ctx.query.name}`);
    ctx.error(time, `${ctx.query.name}账号未被锁定`);
    await app.redis.del(`${AUTHTIME}-${ctx.query.name}`);

    this.ctx.jsonBody = {
      data: {
        message: `${ctx.query.name}解锁成功!`,
      },
    };
  }
}

module.exports = AuthController;
