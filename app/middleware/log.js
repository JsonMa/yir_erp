'use strict';

module.exports = () => async (ctx, next) => {
  ctx.logger.info('\n user: %s \n requestBody: %j', ctx.auth.tel, ctx.request.body);
  await next();
};
