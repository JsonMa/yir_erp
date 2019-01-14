'use strict';

const ObjectId = require('mongoose').Types.ObjectId;

module.exports = () => async (ctx, next) => {
  const {
    config,
  } = ctx.app;
  const accessToken = ctx.request.headers['access-token'] || ctx.cookies.get(config.cookies_prefix + 'access-token');
  let session = ctx.cookies.get(config.cookies_prefix + 'session');
  if (!session) {
    session = ObjectId();
    ctx.cookies.set(config.cookies_prefix + 'session', session);
  }
  ctx.auth = {
    sid: session,
  };

  // 过滤出未携带token的请求
  if (!accessToken) {
    await next();
    return;
  }

  try {
    // redis中获取用户信息
    const redisContent = await ctx.app.redis.get(`access-token-${accessToken}`);
    ctx.assert(redisContent, 403, 'token已过期，请重新登陆');
    const content = JSON.parse(redisContent);
    Object.assign(ctx.auth, content);

  } catch (e) {
    // 清楚缓存
    ctx.cookies.set(config.cookies_prefix + 'access-token', null);
    ctx.cookies.set(config.cookies_prefix + 'user', null);

    ctx.status = 403;
    ctx.body = {
      code: 4030001,
      message: e.message || 'access-token已过期或解析错误,请重新登录',
    };
    return null;
  }

  await next();
};
