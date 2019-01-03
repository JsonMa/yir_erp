'use strict';

const {
  VError,
} = require('verror');

module.exports = {
  get jsonBody() {
    return this.body;
  },

  set jsonBody(obj) {
    const {
      data,
      meta = {},
      embed = {},
    } = obj;
    this.assert(data && typeof data === 'object', 'jsonBody 传入data应为Object');

    this.set('Access-Control-Allow-Origin', 'http://localhost:8080');
    this.body = {
      meta,
      embed,
      data,
    };
  },

  async verify(rule, params) {
    const {
      errors,
    } = this.app;
    const ret = await this.validate(rule, params).catch(function(e) {
      throw new VError({
        name: errors.EBADREQUEST,
        cause: e,
      }, '错误的请求参数');
    });
    return ret;
  },

  // 类似于ctx.assert()根据条件判断抛出EAPPLICATION错误
  // 也可以直接抛出错误, condition 传 false
  error(condition = false, msg, info = {}) {
    this.assert(info instanceof Object, 'appError.info 应为 Object');
    if (condition) return;
    this.logger.error({
      msg,
      info,
    });
    throw new VError({
      name: this.app.errors.EAPPLICATION,
      info: Object.assign({
        condition,
      }, {
        orginInfo: info,
      }),
    }, msg || '服务端错误');
  },

  // 检查是否登录
  authPermission() {
    this.assert(this.auth.type, 403);
  },

  // 检查管理员权限
  adminPermission() {
    this.assert.equal(this.auth.type, 'ADMIN', 403);
  },

  // SaaS用户权限
  passortPermission() {
    this.assert.equal(this.auth.type, 'PASSPORT', 403);
  },

  // app用户权限
  appPermission() {
    this.assert(this.auth.type === 'APP' || this.auth.type === 'HEPASSPORT', 403);
  },

  // 自定义组合权限
  customePermission(permissions) {
    const {
      EAPPLICATION,
    } = this.app.errors;
    const _self = this;
    const permissionsRule = [ 'APP', 'PASSPORT', 'HEPASSPORT', 'ADMIN' ];

    this.assert(permissions instanceof Array, new VError({
      name: EAPPLICATION,
      info: {
        permissions,
      },
    }, '[permissions] 应为数组'));
    permissions.forEach(p => {
      _self.assert(~permissionsRule.indexOf(p), new VError({ // eslint-disable-line
        name: EAPPLICATION,
        info: {
          permission: p,
        },
      }, `[permissions] 包含非法权限 [${p}]`));
    });

    this.assert(~permissions.indexOf(this.auth.type), 403); // eslint-disable-line
  },

  // 检查用户为当前用户或管理员
  userPermission(userId) {
    this.assert(userId, 403);
    if (this.auth.type === 'ADMIN') return null;
    this.assert.equal(this.auth.account_id, userId.toString(), 403);
  },
};
