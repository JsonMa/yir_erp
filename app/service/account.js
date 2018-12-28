'use strict';

const Service = require('../lib/DBService');
const _ = require('underscore');
const lodash = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;

class AccountService extends Service {
  constructor(ctx) {
    super(ctx, 'Account');
  }

  async findAccountInfo(userIDs) {
    const { service } = this;

    const accounts = await this.findByIds(userIDs);
    const admins = await service.accountAdmin.findMany({ account_id: { $in: userIDs } });
    const passports = await service.accountPassport.findMany({ account_id: { $in: userIDs } });

    const indexed = _.indexBy(admins, 'account_id');
    Object.assign(indexed, _.indexBy(passports, 'account_id'));

    const ret = [];
    for (let i = 0; i < accounts.length; i++) {
      const newObj = {
        _id: accounts[i]._id,
        type: accounts[i].type,
        name: indexed[ accounts[i]._id ].name,
        nickname: indexed[ accounts[i]._id ].nickname,
        role: indexed[ accounts[i]._id ].role,
        tel: accounts[i].tel,
      };
      ret.push(newObj);
    }
    return ret;
  }

  async authValid(key) {
    const { app, ctx } = this;
    const { AUTHTIME } = app.redisPrefix;
    const { auth } = app.config;

    const time = await app.redis.get(`${AUTHTIME}-${key}`);
    ctx.error(time < auth.time, `已超过最大验证次数，账号已被锁定 ${auth.lock_time / 60} 分钟`);
  }

  async setAuthTime(key, condition, clear = true, type = 'login') {
    const { app, ctx } = this;
    const { AUTHTIME } = app.redisPrefix;
    const { auth } = app.config;
    const msg = {
      login: '用户名或密码错误',
      authcode: '手机验证码已过期或错误',
    };

    const time = await app.redis.get(`${AUTHTIME}-${key}`) || 0;
    ctx.error(time < auth.time, `已超过最大验证次数，账号已被锁定 ${auth.lock_time / 60} 分钟`);

    if (condition) {
      if (clear) await app.redis.del(`${AUTHTIME}-${key}`);
    } else {
      await app.redis.set(`${AUTHTIME}-${key}`, parseInt(time) + 1, 'EX', auth.lock_time);
      ctx.assert(auth.time - time > 1, `${msg[type]},账号已被锁定`);
      ctx.assert(false, `${msg[type]},还有${auth.time - time - 1}次机会`);
    }
  }

  // 编码方式
  // 1. str1 = encodeURI(str)    url 编码
  // 2. str2 = window.btoa(str1) base64编码
  // 3. str2 末尾等号个数替换为对应数字(如果没有等号则填0)
  // 4. 做倒序
  decodePassword(pwd) {
    const { ctx } = this;
    let decodePwd;
    try {
      const fallPwd = pwd.split('').reverse().join('');
      const base64Pwd = fallPwd.slice(0, -1) + new Array(parseInt(fallPwd.slice(-1))).fill('=').join('');
      const decodeBase64 = Buffer.from(base64Pwd, 'base64').toString('utf8');
      decodePwd = decodeURI(decodeBase64);
    } catch (err) {
      ctx.error(!err, '密码解析错误');
    }

    const regLength = /^.{6,15}$/.test(decodePwd);
    const regNumber = /\d/.test(decodePwd);
    const regChar = /[A-Za-z]/.test(decodePwd);
    const regSpeci = /[!@#$%^&*?~/_\-.]/.test(decodePwd);
    ctx.error(regLength && regNumber + regChar + regSpeci >= 2, '密码至少应包含[数字][字母][特殊符号]中的两种且大于6位小于15位');

    return decodePwd;
  }

  async cookieSet(user) {
    const { ctx, app } = this;
    const { config } = app;
    const { tokenExpireTime, appTokenExpireTime } = config.auth;
    const objectId = ObjectId();

    const token = {
      account_id: user.account_id.toString(),
      name: user.name,
      tel: user.tel,
      type: user.type,
      ip: ctx.ip,
    };

    if (user.role) token.role = user.role;

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

  // 清理cookies，token
  async clearCookiesAndToken() {
    const { ctx, config, app } = this;

    const objectId = ctx.cookies.get(config.cookies_prefix + 'access-token');
    await app.redis.del(`access-token-${objectId}`);

    // saas 前端需清理OneNET cookie 需要设置domain
    if (ctx.headers.cookie) {
      ctx.logger.info('clear OneNET cookie');
      let cookies = ctx.headers.cookie.split(';');
      cookies = _.compact(cookies);
      cookies.map(c => c.split('=')[0]).forEach(key => {
        key.trim(key) === 'session'
          ? ctx.cookies.set(key, null, { domain: `.${ctx.hostname}` })
          : ctx.cookies.set(key, null, lodash.pickBy({
            domain: !~key.indexOf(app.config.cookies_prefix) ? ctx.hostname.replace('www', '') : null,
          }));
      });
    }

    ctx.logger.info('clear OneNET cookie over');
  }
}

module.exports = AccountService;
