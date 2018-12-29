
'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;
  /**
   * 合作伙伴 Model
   *
   * @model Cooperator
   * @namespace Model
   * @property {String}       name           - 名称
   * @property {Object}       logo           - logo
   * @property {String}       introduce      - 介绍
   * @property {Array}        label          - 标签
   * @property {String}       addr           - 地址
   * @property {String}       contact        - 联系方式
   * @property {String}       type           - 合作伙伴类型，供应商/客户
   * @property {Boolean}      enable         - 是否启用
   * @property {Date}         deleted_at     - 删除时间
   *
  */

  const schema = new Schema({
    name: String,
    logo: {
      type: Schema.Types.ObjectId,
      ref: 'file',
    },
    introduce: String,
    label: Array,
    addr: String,
    contact: {
      name: String,
      tel: String,
      email: String,
    },
    enable: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: [ 'SUPPLIER', 'PURCHASER', 'BOTH' ],
      default: 'SUPPLIER',
    },
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('cooperator', schema);
};
