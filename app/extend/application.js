'use strict';

const { VError } = require('verror');
const PRODUCT_CATEGORY_CACHE = Symbol('ProductCategory#cache');

module.exports = {
  get errors() {
    const errors = {
      EFATAL: 'EFATAL',
      EMONGODB: 'EMONGODB',
      EBADREQUEST: 'EBADREQUEST',
      EAPPLICATION: 'EAPPLICATION',
      EONENET: 'EONENET',
      ENOTAUTHORIZED: 'ENOTAUTHORIZED',
      ENOTPERMITTED: 'ENOTPERMITTED',
    };
    const handler = {
      get(target, name) {
        if (name in target) {
          return target[name];
        }
        throw new VError({
          name: 'EFATAL',
          message: '[Application] 使用未定义的ERROR',
        });
      },
    };
    return new Proxy(errors, handler);
  },
  get productCategoryCache() {
    if (!this[PRODUCT_CATEGORY_CACHE]) this[PRODUCT_CATEGORY_CACHE] = {};
    return this[PRODUCT_CATEGORY_CACHE];
  },
  get isProd() {
    return this.config.env === 'prod';
  },
  get smsvalues() {
    const smsvalues = {
      SMSOK: '10701',
      MINUTELIMITPREFIX: 'minute-limit',
      AVAILABLEPREFIX: 'authcode',
    };

    const handler = {
      get(target, name) {
        if (name in target) {
          return target[name];
        }
        throw new VError({
          name: 'EFATAL',
          message: '[Application] 使用未定义的SMSCODE',
        });
      },
    };
    return new Proxy(smsvalues, handler);
  },
  get redisPrefix() {
    const prefix = {
      SHAREQRCODE: 'share-qrcode',
      DEBUGQRCODE: 'debug-qrcode',
      CAPTCHA: 'captcha',
      AUTHTIME: 'auth-time',
    };

    const handler = {
      get(target, name) {
        if (name in target) {
          return target[name];
        }
        throw new VError({
          name: 'EFATAL',
          message: '[Application] 使用未定义的 redisPrefix',
        });
      },
    };
    return new Proxy(prefix, handler);
  },

};
