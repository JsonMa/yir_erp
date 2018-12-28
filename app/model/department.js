'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;

  /**
   * 部门 Model
   *
   * @model DocumentComment
   * @namespace Model
   * @property {Number}        name               - 部门名称
   * @property {String}        iamge              - 部门图片
   * @property {String}        remark             - 相关描述
   * @property {Boolean}       enable             - 是否启用
   * @property {Date}          deleted_at         - 删除时间
   *
   */

  const schema = new Schema({
    name: String,
    iamge: {
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

  return mongoose.model('department', schema);
};
