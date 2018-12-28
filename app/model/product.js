'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;

  /**
 * 产品 Model
 *
 * @model Product
 * @namespace Model
 * @property {String}    no                    - 编号
 * @property {String}    name                  - 名称
 * @property {String}    model                 - 型号
 * @property {String}    specific              - 规格
 * @property {Object}    image                 - 图片
 * @property {String}    remark                - 备注
 * @property {Object}    category              - 分类
 * @property {Date}      deleted_at            - 删除时间
 * @property {Boolean}   enable                - 是否启用
 *
 */

  const schema = new Schema({
    no: String,
    name: String,
    model: String,
    specific: String,
    image: {
      type: Schema.Types.ObjectId,
      ref: 'file',
    },
    remark: String,
    category: {
      type: Schema.Types.ObjectId,
      ref: 'category',
    },
    enable: {
      type: Boolean,
      default: true,
    },
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('product', schema);
};
