'use strict';

const { Controller } = require('egg');
const uuid = require('uuid');

class MaterialEntryController extends Controller {
  /**
   * 新增材料入库单
   *
   * @memberof MaterialEntryController
   */
  async create() {

    const { ctx } = this;
    const { body } = ctx.request;
    await ctx.verify('schema.materialEntry', body);
    const { real_count, per_price } = body;

    body.no = uuid(); // 生成单号
    body.totalPrice = real_count * per_price; // 设置总价

    const entry = await ctx.model.MaterialEntry.create(body);
    this.ctx.jsonBody = {
      data: entry,
    };
  }

  get listRule() {
    return {
      $async: true,
      $merge: {
        source: {
          $ref: 'schema.pagination#',
        },
        with: {
          properties: {
            keyword: {
              type: 'string',
            },
          },
          required: [],
        },
      },
    };
  }

  /**
   * 材料入库单列表
   *
   * @memberof MaterialEntryController
   */
  async index() {
    const { ctx } = this;
    const { service } = ctx;
    const { query } = ctx.request;
    const { limit = 10, offset = 0, sort = '-created_at' } = query;
    const { generateSortParam } = ctx.helper.pagination;

    await this.ctx.verify(this.listRule, query);

    const filter = {};
    if (query.keyword) {
      filter.$or = [
        { name: { $regex: query.keyword } },
        { no: { $regex: query.keyword } },
        { model: { $regex: query.keyword } },
        { specific: { $regex: query.keyword } },
      ];
    }
    const materials = await service.material.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort) }, 'supplier category');

    this.ctx.jsonBody = {
      meta: {
        count: await service.material.count(filter),
      },
      data: materials,
    };
  }

  /**
   * 材料入库单详情
   *
   * @memberof MaterialEntryController
   */
  async get() {
    const { ctx } = this;
    const { params, service } = ctx;

    await ctx.verify('schema.id', params);
    const material = await service.material.findById(params.id, 'supplier category')
      .catch(err => {
        ctx.error(!err, 404);
      });

    this.ctx.jsonBody = {
      data: material,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.material#',
        },
        with: {
          properties: {
            id: {
              $ref: 'schema.definition#/oid',
            },
          },
        },
      },
      $async: true,
    };
  }

  /**
   * 修改材料入库单
   *
   * @memberof MaterialEntryController
   */
  async update() {
    const { ctx, updateRule } = this;
    const { query, body } = ctx.request;
    const { params, service } = ctx;
    const updateParams = Object.assign({}, query, params, body);

    await this.ctx.verify(updateRule, updateParams);
    const material = await service.material.findById(params.id, 'supplier category').catch(err => {
      ctx.error(!err, 404);
    });

    await service.material.update({ _id: params.id }, updateParams);
    Object.assign(material, updateParams);

    this.ctx.jsonBody = {
      data: material,
    };
  }

  /**
   * 删除材料入库单
   *
   * @memberof MaterialEntryController
   */
  async delete() {
    const { ctx } = this;
    const { params, service } = ctx;

    await ctx.verify('schema.id', params);
    const material = await service.material.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.material.destroy({ _id: params.id });

    this.ctx.body = {
      data: material,
    };
  }
}

module.exports = MaterialEntryController;
