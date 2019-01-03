'use strict';

const {
  timestamps,
} = require('../lib/model_common');

module.exports = ({
  mongoose,
}) => {
  const {
    Schema,
  } = mongoose;

  /**
   *  入库单Model
   *
   * @model AaterialEntry
   * @namespace Model
   * @property {String}        no                 - 单号
   * @property {Object}        material           - 材料
   * @property {String}        application_count  - 申请数量
   * @property {String}        real_count         - 实际数量
   * @property {String}        per_price          - 单价
   * @property {String}        total_price        - 总价
   * @property {String}        unit               - 单位
   * @property {Object}        maker              - 制单员
   * @property {Object}        buyer              - 采购员
   * @property {Object}        sender             - 送货员
   * @property {Object}        inspector          - 质检员
   * @property {Object}        reviewer           - 审核人
   * @property {String}        status             - 审核状态
   * @property {String}        rejectedReason     - 拒绝原因
   * @property {Boolean}       quality_result     - 质检结果
   * @property {String}        purchase_method    - 付款方式
   * @property {String}        remark             - 入库单备注
   * @property {Date}          deleted_at         - 删除时间
   *
   */

  const schema = new Schema({
    no: String,
    material: {
      type: Schema.Types.ObjectId,
      ref: 'material',
    },
    application_count: Number,
    real_count: Number,
    per_price: Number,
    total_price: Number,
    unit: String,
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    remark: String,
    sender: String,
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    maker: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    inspector: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    quality_result: {
      type: Boolean,
      default: false,
    },
    purchase_method: {
      type: String,
      enum: [ 'CASH', 'BANK', 'WECHAT', 'ALIPAY' ],
      default: 'CASH',
    },
    status: {
      type: String,
      enum: [ 'UNREVIEW', 'REACTIVATED', 'PASSED', 'REJECTED' ],
      default: 'UNREVIEW',
    },
    rejectedReason: {
      type: String,
      default: '',
    },
    deleted_at: Date,
  }, Object.assign({}, {
    timestamps,
  }));

  return mongoose.model('material_entry', schema);
};
