'use strict';

const { Controller } = require('egg');

class MaterialOutController extends Controller {
  /**
   * 新增材料出库单
   *
   * @memberof MaterialOutController
   */
  async create() {

    const { ctx } = this;
    const { body } = ctx.request;
    await ctx.verify('schema.material', body);

    const isExistend = ctx.service.cooperator.isExsited({ name: body.name });
    ctx.error(!isExistend, '该名称已存在');

    const { supplier } = body;
    if (supplier) {
      const { type } = await ctx.service.cooperator.findById(supplier).catch(err => {
        ctx.error(!err, 404);
      });
      ctx.error([ 'SUPPLIER', 'BOTH' ].includes(type), '不属于供应商类型');
    }

    const material = await ctx.model.Material.create(body);
    this.ctx.jsonBody = {
      data: material,
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
   * 材料出库单列表
   *
   * @memberof MaterialOutController
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
   * 材料出库单详情
   *
   * @memberof MaterialOutController
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
   * 修改材料出库单
   *
   * @memberof MaterialOutController
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
   * 删除材料出库单
   *
   * @memberof MaterialOutController
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

module.exports = MaterialOutController;
