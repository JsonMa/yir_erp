'use strict';

module.exports = appInfo => {
  const config = exports = {};

  config.keys = appInfo.name + '_1544601615765_6211';

  config.middleware = [ 'auth', 'log' ];

  config.mongoose = {
    client: {
      url: 'mongodb://localhost:27017/cqerp',
      options: {
        user: 'cqerp',
        pass: 'cqerp123456',
      },
    },
  };

  config.redis = {
    client: {
      port: 6379,
      host: 'localhost',
      password: '',
      db: 0,
    },
  };

  // token 时效
  config.auth = {
    anonymityExpireTime: 3600 * 1000, // 1 小时
    tokenExpireTime: 3600 * 24 * 1000, // 1 天
    time: 5, // 尝试错误次数
    lock_time: 60 * 15, // 锁定时间15分钟
    connectionExp: 3600,
  };

  // 图形验证码
  config.captcha = {
    length: 4,
    range: 'ABCDEFGHKMNPQRSTUVWXYZ3456789',
    expire: 60 * 3, // 单位秒 = 3分钟
  };

  // 时区
  config.zoneTime = {
    zone: 8,
  };

  // 上传文件格式限制
  config.multipart = {
    fileExtensions: [
      '.pdf',
      '.doc',
      '.docx',
      '.rar',
    ],
  };

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  return config;
};
