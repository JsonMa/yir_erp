'use strict';

const Service = require('../lib/DBService');
const ObjectId = require('mongoose').Types.ObjectId;
const lodash = require('lodash');

class AccountService extends Service {
  constructor(ctx) {
    super(ctx, 'Account');
  }
  async cookieSet(user) {
    const {
      ctx,
      app,
    } = this;
    const {
      config,
    } = app;
    const {
      tokenExpireTime,
      appTokenExpireTime,
    } = config.auth;
    const objectId = ObjectId();

    const token = {
      account_id: user._id,
      name: user.name,
      tel: user.tel,
      type: user.type,
      ip: ctx.ip,
    };

    // redis存储
    await app.redis.set(
      `access-token-${objectId}`,
      JSON.stringify(token),
      'EX',
      user.type === 'APP' ? appTokenExpireTime / 1000 : tokenExpireTime / 1000
    );

    // cookie设置
    ctx.cookies.set(config.cookies_prefix + 'access-token', objectId, {
      maxAge: user.type === 'APP' ? appTokenExpireTime : tokenExpireTime,
      overwrite: true,
      httpOnly: false,
    });
    ctx.cookies.set(config.cookies_prefix + 'user', JSON.stringify({
      id: user.account_id,
      avatar: user.avatar,
      type: user.type,
      nickname: user.nickname ? encodeURI(user.nickname).replace(/;/g, '') : null,
    }), {
      maxAge: app.config.auth.tokenExpireTime,
      overwrite: true,
      httpOnly: false,
    });
    return objectId;
  }

  async clearCookiesAndToken() {
    const {
      ctx,
      config,
      app,
    } = this;

    const objectId = ctx.cookies.get(config.cookies_prefix + 'access-token');
    await app.redis.del(`access-token-${objectId}`);

    // saas 前端需清理OneNET cookie 需要设置domain
    if (ctx.headers.cookie) {
      ctx.logger.info('clear OneNET cookie');
      let cookies = ctx.headers.cookie.split(';');
      cookies = _.compact(cookies);
      cookies.map(c => c.split('=')[0]).forEach(key => {
        key.trim(key) === 'session' ?
          ctx.cookies.set(key, null, {
            domain: `.${ctx.hostname}`,
          }) :
          ctx.cookies.set(key, null, lodash.pickBy({
            domain: !~key.indexOf(app.config.cookies_prefix) ? ctx.hostname.replace('www', '') : null,
          }));
      });
    }

    ctx.logger.info('clear OneNET cookie over');
  }
}

module.exports = AccountService;
