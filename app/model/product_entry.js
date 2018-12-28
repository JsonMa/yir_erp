'use strict';

const { timestamps } = require('../lib/model_common');

module.exports = ({ mongoose }) => {
  const { Schema } = mongoose;
  /**
   * 成品入库 Model
   *
   * @model Account
   * @namespace Model
   * @property {String}       no                           - 编号
   * @property {Array}        products                     - 产品
   * @property {Number}       total_count                  - 总数量
   * @property {Object}       maker                        - 制单人
   * @property {Object}       reviewer                     - 审核人
   *
   */

  const schema = new Schema({
    no: String,
    products: {
      type: Array,
      item: {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'product',
        },
        count: Number,
        remark: String,
      },
    },
    total_count: Number,
    maker: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
  }, Object.assign({}, { timestamps }));

  return mongoose.model('product_entry', schema);
};
