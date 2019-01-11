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


  authPermission() {
    this.assert(this.auth.role, 'NORMAL', 403);
  },

  adminPermission() {
    this.assert.equal(this.auth.role, 'ADMIN', 403);
  },

  caiwuPermission() {
    this.assert.equal(this.auth.role, 'CAIWU', 403);
  },

  kufangPermission() {
    this.assert.equal(this.auth.role, 'KUGUAN', 403);
  },

  zhijianPermission() {
    this.assert.equal(this.auth.role, 'ZHIJIAN', 403);
  },

  // 自定义组合权限
  customPermission() {
    const permissionsRule = [ 'CAIWU', 'ZHIJIAN', 'KUGUAN', 'ADMIN', 'CAIGOU' ];
    this.assert(permissionsRule.includes(this.auth.role), 403);
  },

  // 检查用户为当前用户或管理员
  userPermission(userId) {
    this.assert(userId, 403);
    if (this.auth.role === 'ADMIN') return null;
    this.assert.equal(this.auth._id, userId.toString(), 403);
  },

  roleConvert(role) {
    let convertedRole = '';
    switch (role) {
      case 'KUGUAN':
        convertedRole = '库管';
        break;
      case 'CAIWU':
        convertedRole = '财务';
        break;
      case 'CHUNA':
        convertedRole = '出纳';
        break;
      case 'CAIGOU':
        convertedRole = '采购';
        break;
      case 'ZHIJIAN':
        convertedRole = '质检';
        break;
      case 'NORMAL':
        convertedRole = '普通用户';
        break;
      case 'ADMIN':
        convertedRole = '管理员';
        break;
      default:
        convertedRole = '普通用户';
        break;
    }
    return convertedRole;
  },
};
