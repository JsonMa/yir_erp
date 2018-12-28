'use strict';

const Service = require('../lib/DBService');
const moment = require('moment');

class DeviceLogService extends Service {
  constructor(ctx) {
    super(ctx, 'DeviceLog');
  }

  dateCalculate(from, to) {
    const { ctx } = this;
    const range = 7;
    const ret = {
      from: moment().subtract(range, 'days'),
      to: moment(),
    };
    if (from && !to) {
      ret.from = moment(from);
      ret.to = moment.min(ret.to, moment(from).add(range, 'd'));
    }
    if (!from && to) {
      ret.to = moment(to);
      ret.from = moment.max(ret.from, moment(to).subtract(range, 'd'));
    }
    if (from && to) {
      const diff = new Date(to).getTime() - new Date(from).getTime();
      ctx.error(diff > 0, '开始时间不能大于结束时间');
      ctx.error(diff < range * 1000 * 60 * 60 * 24, `日志查询不能大于${range}天`);
      ret.from = from;
      ret.to = to;
    }

    return ret;
  }
}

module.exports = DeviceLogService;
