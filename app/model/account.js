'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;
  /**
   * 用户 Model
   *
   * @model Account
   * @namespace Model
   * @property {String}       name           - 名称
   * @property {String}       password       - 密码
   * @property {String}       role           - 角色
   * @property {String}       nick_name      - 昵称
   * @property {String}       email          - 邮箱
   * @property {Object}       avator         - 头像
   * @property {Object}       department     - 部门
   * @property {String}       tel            - 电话
   * @property {String}       addr           - 地址
   * @property {Date}         entry_time     - 入职时间
   * @property {Date}         leave_time     - 离职时间
   * @property {String}       state          - 当前状态
   * @property {String}       gender         - 性别
   * @property {String}       id_number      - 身份证号
   * @property {Object}       bank           - 银行
   * @property {String}       bank.name      - 银行名称
   * @property {String}       bank.id        - 银行卡号
   * @property {Boolean}      enable         - 是否启用
   * @property {Date}         deleted_at     - 删除时间
   *
  */

  const schema = new Schema({
    name: String,
    password: String,
    role: {
      type: String,
      enum: [ 'KUGUAN', 'CAIWU', 'CAIGOU', 'ZHIJIAN', 'NORMAL', 'ADMIN' ],
    },
    nick_name: String,
    email: String,
    avator: {
      type: Schema.Types.ObjectId,
      ref: 'file',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'department',
    },
    tel: String,
    addr: String,
    entry_time: Date,
    leave_time: Date,
    state: {
      type: String,
      enum: [ 'EXIST', 'LEAVE' ],
    },
    gender: {
      type: String,
      enum: [ 'MALE', 'FEMAL' ],
    },
    id_number: String,
    bank: {
      name: String,
      id: String,
    },
    enable: {
      type: Boolean,
      default: true,
    },
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('account', schema);
};
