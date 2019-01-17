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
   * 领料单 Model
   *
   * @model MaterialOut
   * @namespace Model
   * @property {String}      no               - 编号
   * @property {Array}       materials        - 材料
   * @property {String}      reason           - 原因
   * @property {Number}      total_count      - 总数量
   * @property {Object}      maker            - 制作者
   * @property {Object}      applicant        - 申请者
   * @property {Object}      reviewer         - 审核人
   * @property {String}      status           - 审核状态
   * @property {Date}        deleted_at       - 删除时间
   *
   */

  const schema = new Schema({
    no: String,
    materials: {
      type: Array,
      item: {
        material: {
          type: Schema.Types.ObjectId,
          ref: 'material',
        },
        count: String,
        remark: String,
        order: String,
      },
    },
    reason: String,
    total_count: Number,
    maker: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    financor: {
      type: Schema.Types.ObjectId,
      ref: 'account',
    },
    status: {
      type: String,
      enum: [ 'UNREVIEW', 'REACTIVATED', 'PASSED', 'REJECTED' ],
      default: 'UNREVIEW',
    },
    rejected_reason: {
      type: String,
    },
    deleted_at: Date,
  }, Object.assign({}, {
    timestamps,
  }));

  return mongoose.model('material_out', schema);
};
