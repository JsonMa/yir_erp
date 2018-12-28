'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;

  /**
   * 分类 Model
   *
   * @model ProductCategory
   * @namespace Model
   * @property {String}      no                - 分类号
   * @property {String}      parent            - 父类号
   * @property {String}      type              - 分类类型(原材料/成品)
   * @property {Boolean}     enable            - 启用状态
   * @property {Object}      image             - 图标 ID
   * @property {String}      name              - 名称
   * @property {String}      stage             - 等级 1,2,3
   * @property {Date}        deleted_at        - 删除时间
   *
  */

  const schema = new Schema({
    no: String,
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'category',
    },
    name: String,
    image: {
      type: Schema.Types.ObjectId,
      ref: 'file',
    },
    type: {
      type: String,
      enum: [ 'MATERIAL', 'PRODUCT' ],
      default: 'MATERIAL',
    },
    stage: {
      type: Number,
      enum: [ 1, 2, 3, 4 ],
      default: 1,
    },
    enable: {
      type: Boolean,
      default: true,
    },
    deleted_at: Date,
  }, Object.assign({}, { timestamps }));

  return mongoose.model('category', schema);
};
