'use strict';

const { Controller } = require('egg');
const VError = require('verror');

class AuthController extends Controller {
  get mobileRule() {
    return {
      properties: {
        tel: {
          $ref: 'schema.definition#/mobile',
        },
        check: {
          type: 'boolean',
          default: false,
        },
      },
      required: [ 'tel' ],
      $async: true,
      additionalProperties: false,
    };
  }

  get editPasswordRule() {
    return {
      properties: {
        password: {
          $ref: 'schema.definition#/password',
        },
        authcode_id: {
          $ref: 'schema.definition#/oid',
        },
      },
      $async: true,
      required: [ 'password', 'authcode_id' ],
      additionalProperties: false,
    };
  }

  async editPassword() {
    const { service, ctx, app } = this;
    const { body } = ctx.request;
    const { authcode_id: authcodeId, password } = body;
    const { EAPPLICATION } = app.errors;

    await this.ctx.validate(this.editPasswordRule, body);
    service.account.decodePassword(password);

    // 验证码校验及更改不可用
    const authcode = await ctx.service.authcode.findOne({
      _id: authcodeId,
      valid: true,
    });
    ctx.assert(authcode, new VError({
      name: EAPPLICATION,
      info: { authcodeId },
    }, '验证码校验失败'));
    authcode.valid = false;
    await authcode.save();

    // 用户校验及修改密码
    const account = await service.account.findOne({
      type: 'APP',
      tel: authcode.tel,
    });
    ctx.assert(account, new VError({
      name: EAPPLICATION,
      info: { account },
    }, `tel-[${authcode.tel}] 账户不存在`));

    const accountApp = await service.accountApp.findOne({
      account_id: account._id.toString(),
    });
    ctx.assert(accountApp, new VError({
      name: EAPPLICATION,
      info: { accountApp },
    }, 'App 账户不存在'));

    accountApp.password = password;
    await service.account.setAuthTime(account.tel, true);
    await accountApp.save();

    await service.account.clearCookiesAndToken();

    ctx.status = 204;
  }

  async generateCaptcha() {
    const { service } = this.ctx;

    const captcha = await service.captcha.bmpCaptcha();

    this.ctx.type = 'bmp';
    this.ctx.body = captcha.getFileData();
  }

  async sendAuthcode() {
    const { body } = this.ctx.request;
    const { service, ctx } = this;
    const { tel, check = false } = body;

    await this.ctx.verify(this.mobileRule, body);

    const checkResult = await service.account.findOne({ tel, type: 'APP' });
    if (check) {
      ctx.error(checkResult, `手机号[${tel}]不存在`);
    } else {
      ctx.error(!checkResult, `手机号[${tel}]已存在`);
    }

    const authcode = await service.authcode.sendAuthcode(tel);

    ctx.jsonBody = { data: { _id: authcode._id } };
  }

  get authcodeVerifyRule() {
    return {
      properties: {
        id: {
          $ref: 'schema.definition#/oid',
        },
        code: { type: 'string' },
      },
      $async: true,
      required: [ 'id', 'code' ],
      additionalProperties: false,
    };
  }

  async authcodeVerify() {
    const { ctx, service, authcodeVerifyRule } = this;
    const { code } = ctx.request.body;

    await ctx.verify(authcodeVerifyRule, Object.assign({ code }, ctx.params));

    await service.account.authValid(ctx.params.id);
    const authcode = await service.authcode.findOne({
      _id: ctx.params.id,
      valid: null,
      expired_at: { $gte: new Date() },
    });

    await ctx.service.account.setAuthTime(
      ctx.params.id,
      authcode && code === authcode.code,
      true,
      'authcode'
    );
    authcode.valid = true;
    await authcode.save();

    ctx.status = 204;
  }

  get registerRule() {
    return {
      properties: {
        password: {
          $ref: 'schema.definition#/password',
        },
        authcode_id: {
          $ref: 'schema.definition#/oid',
        },
      },
      $async: true,
      required: [ 'authcode_id', 'password' ],
      additionalProperties: false,
    };
  }

  async register() {
    const { ctx, service, registerRule, app } = this;
    const { EAPPLICATION } = app.errors;
    const { body } = ctx.request;
    const { password, authcode_id: authcodeId } = body;

    await ctx.validate(registerRule, body);
    service.account.decodePassword(password);

    // 验证码校验及更改不可用
    const authcode = await ctx.service.authcode.findOne({
      _id: authcodeId,
      valid: true,
    });
    ctx.assert(authcode, new VError({
      name: EAPPLICATION,
      info: { authcodeId },
    }, '验证码校验失败'));
    authcode.valid = false;
    await authcode.save();

    // 注册账户
    await service.accountApp.register({ tel: authcode.tel, password });

    ctx.status = 204;
  }

  get loginRule() {
    return {
      properties: {
        type: {
          type: 'string',
          enum: [ 'he_passport', 'admin', 'app' ],
        },
        name: {
          $ref: 'schema.definition#/str',
        },
        password: {
          $ref: 'schema.definition#/password',
        },
        token: {
          $ref: 'schema.definition#/text',
        },
        captcha: {
          type: 'string',
        },
      },
      $async: true,
      required: [ 'type' ],
      additionalProperties: false,
    };
  }

  async login() {
    const { ctx } = this;
    const { body } = this.ctx.request;
    const { service } = this.ctx;
    const { EAPPLICATION } = this.app.errors;
    await ctx.verify(this.loginRule, body);

    let accountBody = null;
    let account = null;

    // 根据不同类型账号类型进行登录验证
    try {
      if (body.type === 'app') {
        accountBody = await service.accountApp.login(body);
      } else if (body.type === 'he_passport') {
        accountBody = await service.accountHePassport.login(body.token);
      } else if (body.type === 'admin') {
        accountBody = await service.accountAdmin.login(body);
      }
      ctx.assert(accountBody, 404);
      account = await service.account.findOne({ _id: accountBody.account_id });
      ctx.assert(account, 404);
    } catch (err) {
      throw new VError({
        name: EAPPLICATION,
        info: { body },
      }, err.message || '账号或密码错误');
    }

    const token = await service.account.cookieSet(Object.assign({},
      account.toJSON(),
      body.type === 'app' ? accountBody : accountBody.toJSON()
    ));

    ctx.body = {
      meta: { token },
      data: accountBody,
    };
  }

  async logout() {
    const { ctx, service } = this;

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
    const { app, ctx } = this;
    const { AUTHTIME } = app.redisPrefix;
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
