'use strict';

const Service = require('../lib/DBService');
const moment = require('moment');

class DeviceTaskService extends Service {
  constructor(ctx) {
    super(ctx, 'DeviceTask');
  }

  // 创建时调用grpc
  async engineTimeTask(task) {
    const { ctx, service } = this;
    const { zoneTime } = this.config;

    const product = await service.product.findById(task.product_id)
      .catch(err => {
        ctx.error(false, `product [${task.product_id}] not found`, err);
      });
    const fn = await service.function.findById(task.function_id)
      .catch(err => {
        ctx.error(false, `function [${task.function_id}] not found`, err);
      });
    this.logger.info(`Engine Task CREATE Request: ${JSON.stringify(task)}`);
    const ret = await this.ctx.grpc.hewu.engine.task.create({
      productId: product.id,
      deviceSn: task.sn,
      functionIndex: fn.index,
      functionType: fn.type,
      trigger: 'TIME',
      zoneTime: {
        zone: zoneTime.zone,
        cron: this.parserCron(task.type === 'TIMING' ? task.timing : task.countdown.triggering_time, task.type),
      },
      cmdValue: task.cmd,
    });
    this.ctx.error(ret.code === 200, ret.err_msg || '引擎创建任务失败');
    this.logger.info(`Engine Task CREATE Response: ${JSON.stringify(ret)}`);
    return ret.id;
  }

  // 修改时调用grpc
  async engineTimeTaskUpdate(id, task, status) {
    const { zoneTime } = this.config;

    const start = status === 'open';
    this.logger.info(`Engine Task UPDATE Request: ${JSON.stringify(task)}`);
    const ret = await this.ctx.grpc.hewu.engine.task.update({
      taskId: id,
      start,
      taskType: task.type,
      zoneTime: {
        zone: zoneTime.zone,
        cron: this.parserCron(task.type === 'TIMING' ? task.timing : task.countdown.triggering_time, task.type),
      },
    });

    this.ctx.error(ret.code === 200, ret.err_msg || '引擎修改任务失败');
    this.logger.info(`Engine Task UPDATE Response: ${JSON.stringify(ret)}`);
    return ret.id;
  }

  // 启用关闭定时倒计时调用grpc
  async engineTimeTaskSet(deviceTask, status) {
    const { ctx } = this;
    const { zoneTime } = this.config;
    const task = {
      taskId: deviceTask.task_s_id.toString(),
      start: status === 'open',
      taskType: deviceTask.type,
    };
    const taskRemain = await this.engineTimeTaskQuery({ taskId: deviceTask.task_s_id.toString(), taskType: deviceTask.type });
    const nextTimestamp = new Date().getTime() + taskRemain[0].remain * 1000;
    if (status === 'open') {
      task.zoneTime = {
        zone: zoneTime.zone,
        cron: this.parserCron(deviceTask.type === 'TIMING' ? deviceTask.timing : nextTimestamp, deviceTask.type),
      };
    }
    this.logger.info(`Engine Task SET Request: ${JSON.stringify(task)}`);
    const ret = await ctx.grpc.hewu.engine.task.update(task);
    ctx.error(ret.code === 200, ret.err_msg || '引擎设置任务失败');

    if (deviceTask.type === 'TIMING') {
      await this.update({ _id: deviceTask._id }, {
        status,
      });
    } else {
      await this.update({ _id: deviceTask._id }, {
        status,
        'countdown.triggering_time': nextTimestamp,
        remain: taskRemain[0].remain,
      });
    }

    this.logger.info(`Engine Task SET Response: ${JSON.stringify(ret)}`);
    return ret.id;
  }

  // 查询时调用grpc
  async engineTimeTaskQuery(tasks) {
    const ret = await this.ctx.grpc.hewu.engine.task.remainTime({
      timeTask: tasks,
    });

    this.ctx.error(ret.code === 200, ret.err_msg || '引擎查询任务失败');
    return ret.remains;
  }

  // 查询某个设备，每一个功能点最近一次定时任务设定的时间
  async findTimer(deviceId) {
    const deviceTask = await this.findMany({ device_id: deviceId, type: 'TIMING', status: 'open' }, null, { sort: [{ function_id: -1 }] });
    if (deviceTask.length === 0) { return []; }

    const functionTaskMap = {};
    let functionId = deviceTask[0].function_id;
    let taskIdsByFunction = [];
    deviceTask.forEach(task => {
      if (functionId.equals(task.function_id)) {
        taskIdsByFunction.push({ taskId: task.task_s_id.toString(), taskType: 'TIMING' });
      } else {
        functionTaskMap[functionId] = taskIdsByFunction;
        functionId = task.function_id;
        taskIdsByFunction = [];
        taskIdsByFunction.push({ taskId: task.task_s_id.toString(), taskType: 'TIMING' });
      }
    });
    functionTaskMap[functionId] = taskIdsByFunction;

    let task;
    let remainMin;
    let taskLen;
    let taskId;
    let timer;
    for (let index in functionTaskMap) {
      task = await this.engineTimeTaskQuery(functionTaskMap[index]);
      taskLen = task.length;
      remainMin = 0;

      for (let i = 0; i < taskLen; i++) {
        if (task[i].remain !== 0) {
          if (remainMin === 0) {
            remainMin = task[i].remain;
            taskId = task[i].id;
          } else if (remainMin !== 0 && remainMin > task[i].remain) {
            remainMin = task[i].remain;
            taskId = task[i].id;
          } else {}
        } else {}
      }
      if (remainMin === 0) {
        functionTaskMap[index] = null;
      } else {
        timer = await this.findOne({ task_s_id: taskId });
        functionTaskMap[index] = timer.timing.time + ',' + timer.cmd;
      }
    }

    return functionTaskMap;
  }

  // 查询某个设备，每一个功能点倒计时任务设定的时间
  async findCountdown(deviceId) {
    const deviceTask = await this.findMany(
      { device_id: deviceId, type: 'COUNTDOWN' },
      null,
      { sort: [{ function_id: 1 }],
      });
    const len = deviceTask.length;
    if (len === 0) {
      return {};
    }
    const functionTaskMap = {};
    let taskIdsByFunction = [];
    deviceTask.forEach(task => {
      taskIdsByFunction.push({ taskId: task.task_s_id.toString(), taskType: 'COUNTDOWN' });
      functionTaskMap[task.function_id] = taskIdsByFunction;
      taskIdsByFunction = [];
    });
    let task;
    let devTask;
    for (let index in functionTaskMap) {
      task = await this.engineTimeTaskQuery(functionTaskMap[index]);
      devTask = await this.findOne({ task_s_id: task[0].id });
      functionTaskMap[index] = task[0].remain + ',' + devTask.cmd + ',' + devTask.status;
    }

    return functionTaskMap;
  }

  // 删除时调用grpc
  async engineTimeTaskDelete(taskId) {
    const ret = await this.ctx.grpc.hewu.engine.task.destroy({
      taskId,
    });

    this.ctx.error(ret.code === 200, ret.err_msg || '引擎删除任务失败');
    return ret.id;
  }

  parserCron(time, type) {
    const typeArray = [ 'COUNTDOWN', 'TIMING' ]; // 倒计时，计时
    const { ctx } = this;

    ctx.error(~typeArray.indexOf(type), `非法 parserCron type [${type}]`);
    const now = moment().format('ss:mm:HH:DD:MM:YYYY').split(':');
    let ret = [ '?', '?', '?', '?', '?', '?', '?' ]; // 秒，分，时，日，月，星期，年

    if (type === 'COUNTDOWN') { // 倒计时 UNIX 时间戳转 cron
      ctx.error(moment(parseInt(time)).isValid(), `非法倒计时时间格式[${time}]`);
      const day = moment(time).format('ss:mm:HH:DD:MM:YYYY').split(':');
      ret = day.slice(0, 5).concat([ '?' ]).concat(day.slice(-1));
    } else if (type === 'TIMING') { // 定时 hh:mm:ss 转换
      const { time: timing, repeat, repeat_day: repeatDay } = time;
      ctx.error(timing && repeat.toString(), '非法定时时间格式');
      const cronSMH = timing.split(':').reverse(); // 秒分时
      let cronD = now[3]; // 几号
      let cronM = repeat ? '*' : now[4];
      const cronY = repeat ? '*' : now[5];
      let cronW; // 周几
      if (repeat) {
        cronW = repeatDay.join(',');
        ret = cronSMH.concat([ '?' ]).concat(cronM).concat(cronW)
.concat(cronY);
      } else {
        if (time.time < moment().format('HH:mm:ss')) {
          // startTime当天的初始时间戳，setTimed设置定时的时间对应的时间戳
          const startTime = cronY + '-' + cronM + '-' + cronD + ' 00:00:00';
          const setTime = cronY + '-' + cronM + '-' + cronD + ' ' + timing;
          const nowTime = new Date(startTime).getTime() + new Date().getTime() + 3600 * 1000 * 24 - new Date(setTime).getTime();
          const next = moment(nowTime).format('ss:mm:HH:DD:MM:YYYY').split(':');
          cronD = next[3];
          cronM = next[4];
          ret = cronSMH.concat(cronD).concat(cronM).concat([ '?' ])
.concat(cronY);
        } else {
          ret = cronSMH.concat(cronD).concat(cronM).concat([ '?' ])
.concat(cronY);
        }
      }
    } else {}
    return ret.join(' ');
  }

  // 删除产品下面已有的所有的某类型任务
  async deleteTaskByPid(Pid, type) {
    const { ctx } = this;

    const tasks = await this.findMany({ product_id: Pid, type, status: 'open' });

    if (tasks) {
      // 因为上线后，产品能够修改用功能点，因此此方法只在研发过程中使用，这个地方不计操作成功与否
      tasks.forEach(async function(task) {
        ctx.grpc.hewu.engine.task.destroy({
          taskId: task.task_s_id,
        });
      });
    }
  }
}

module.exports = DeviceTaskService;
