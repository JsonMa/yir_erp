'use strict';

const Service = require('../lib/DBService');
const _ = require('underscore');
const is = require('is');

class DeviceService extends Service {
  constructor(ctx) {
    super(ctx, 'Device');
  }

  async getDeviceUses(deviceId) {
    const { service } = this.ctx;

    const relationshipList = await service.relationship.findMany({ device_id: deviceId });
    let accountIds = [];

    _.each(relationshipList, function(user) {
      accountIds = _.union(accountIds, [ user.owner_id, user.user_id ]);
    });
    accountIds = _.compact(accountIds);
    let accountList = await service.account.findMany({ _id: { $in: accountIds } });

    const serviceArr = [ 'accountAdmin', 'accountApp', 'accountHePassport', 'accountPassport' ];

    const functionList = [];
    _.each(serviceArr, function(num) {
      functionList.push(service[num].findMany({ account_id: { $in: accountIds } }, '-password'));
    });

    let accountDetailArr = await Promise.all(functionList);

    accountList = _.indexBy(accountList, '_id');

    accountDetailArr = _.flatten(accountDetailArr);

    accountDetailArr = _.map(accountDetailArr, function(account) {
      account = account.toObject();
      account.tel = accountList[account.account_id] ? accountList[account.account_id].tel : '';
      return account;
    });

    return accountDetailArr;
  }

  async isAdminOrUser(deviceId) {
    const { ctx } = this;
    // 管理员可以访问所有，开发者访问自己产品下设备，其他职能访问自己或者分享的设备, 虚拟、调试设备不做限制

    const device = await this.findOne({ _id: deviceId });
    ctx.error(device, `ID为[${deviceId}]的设备不存在`);

    if (!device.debug && !device.virtual) {
      if (ctx.auth.type === 'PASSPORT') {
        await ctx.service.product.findById(device.product_id).catch(err => {
          ctx.error(!err, `ID为[${deviceId}]的设备所属产品不存在，或者你无权访问该产品相关的设备信息`);
        });
      } else if (ctx.auth.type === 'APP' || ctx.auth.type === 'HEPASSPORT') {
        const relationship = await ctx.service.relationship.findOne({
          device_id: deviceId,
          $or: [{ user_id: ctx.auth.account_id }, { owner_id: ctx.auth.account_id, user_id: null }],
        });
        ctx.error(relationship, `ID为[${deviceId}]的设备与当前用户不存在绑定关系`);
      }
    }
  }

  async unBindDevice(pid, devkey) {
    const { ctx } = this;
    ctx.assert(pid && devkey, '解绑设备需要产品id和设备sn');
    const data = {
      productId: pid,
      devKey: devkey,
      data: {
        rawData: JSON.stringify({
          task_id: ctx.service.util.uuid(),
          function: -1,
          type: 'BUFFER',
          value: '03040002000100',
        }),
        tlvData: Buffer.from('03040002000100', 'hex'),
      },
    };
    const ret = await ctx.grpc.hewu.general.order.sendOrder(data)
      .catch(err => {
        ctx.logger.error(err);
        return {};
      });
    ctx.logger.info(`[解绑设备RPC ${pid}-${devkey}]: ${JSON.stringify(ret)}`);
    ctx.error(ret.code === 200 && is.array(ret.feedback) && ret.feedback.length > 0, '设备解绑失败');
    try {
      const retObj = JSON.parse(ret.feedback[0].strPayload);
      ctx.error(retObj.data.result.code === 'OK', '解绑设备失败');
    } catch (err) {
      ctx.error(false, err.message || '解绑设备失败');
    }
  }
}

module.exports = DeviceService;
