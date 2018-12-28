'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;

  /**
   * 文件 Model
   *
   * @model File
   * @namespace Model
   * @property {String}        name         - 文件名
   * @property {String}        path         - 文件路径
   * @property {String}        type         - 文件类型
   * @property {Number}        size         - 文件大小
   *
   */

  const schema = new Schema({
    name: String,
    path: String,
    type: String,
    size: Number,
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('file', schema);
};
