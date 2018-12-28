'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;

  /**
   * 原材料 Model
   *
   * @model Material
   * @namespace Model
   * @property {String}    no                    - 编号
   * @property {String}    name                  - 名称
   * @property {String}    model                 - 型号
   * @property {String}    specific              - 规格
   * @property {Object}    supplier              - 供应商
   * @property {Object}    category              - 分类
   * @property {String}    marked_price          - 标价
   * @property {Object}    image                 - 图片
   * @property {String}    remark                - 备注
   * @property {Boolean}   enable                - 是否启用
   * @property {Date}      deleted_at            - 删除时间
   *
   */

  const schema = new Schema({
    no: String,
    name: String,
    model: String,
    specific: String,
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'cooperator',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'category',
    },
    marked_price: Number,
    image: {
      type: Schema.Types.ObjectId,
      ref: 'file',
    },
    remark: String,
    enable: {
      type: Boolean,
      default: true,
    },
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('material', schema);
};
