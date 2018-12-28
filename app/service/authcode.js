'use strict';

const Service = require('../lib/DBService');
const is = require('is');
const VError = require('verror');

class JwtService extends Service {
  constructor(ctx) {
    super(ctx, 'Authcode');
  }

  async sendAuthcode(tel) {
    const { ctx } = this;
    const { sms } = this.config;
    const { redis } = this.app;
    const { SMSOK, MINUTELIMITPREFIX } = this.app.smsvalues;

    ctx.assert(is.string(tel));

    ctx.logger.info('\n Start sending a short message to the user [%j]', tel);

    // 调用频率限制
    const minuteSended = await redis.get(`${MINUTELIMITPREFIX}-${tel}`);
    ctx.error(!minuteSended, '发送频率超过限制');

    // 获取验证码
    let authcode = await this.findOne({
      tel,
      valid: null,
      expired_at: { $gte: new Date() },
    });
    const code = Math.floor(Math.random() * 90000) + 10001;

    // 短信接口
    const smsRes = await ctx.curl(sms.url, {
      method: 'GET',
      dataType: 'json',
      timeout: 10 * 1000,
      data: {
        sicode: sms.sicode,
        mobiles: tel,
        tempid: sms.tempid,
        code,
      },
    });
    ctx.logger.info(`[SMS send result]: ${JSON.stringify(smsRes)}`);
    ctx.error(smsRes && smsRes.res && smsRes.res.data && smsRes.res.data.result === SMSOK, `短信验证码发送失败 ${tel}`);
    await redis.set(`${MINUTELIMITPREFIX}-${tel}`, code, 'EX', sms.sendTimeLimit);
    if (!authcode) {
      authcode = await this.create({
        tel,
        code,
        expired_at: new Date(new Date().getTime() + sms.expireTime),
      });
    } else {
      await this.update({ _id: authcode._id }, { code, expired_at: new Date(new Date().getTime() + sms.expireTime) });
    }
    return authcode;
  }

  async verifyAuthcode(tel, authcode) {
    const { ctx } = this;
    const { EAPPLICATION } = this.app.errors;

    ctx.assert(is.string(tel));
    ctx.assert(is.string(authcode));

    const dbAuthcode = await this.findOne({
      tel,
      valid: null,
      expired_at: { $gte: new Date() },
    });
    ctx.assert(dbAuthcode, new VError({
      name: EAPPLICATION,
      info: {
        tel,
        authcode,
      },
    }, '短信验证码不存在或已过期'));
    ctx.assert(authcode.toSring() === dbAuthcode.code, new VError({
      name: EAPPLICATION,
      info: {
        tel,
        authcode,
      },
    }, '短信验证码错误'));

    dbAuthcode.valid = true;
    await dbAuthcode.save();
  }
}

module.exports = JwtService;
