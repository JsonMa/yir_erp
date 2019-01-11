'use strict';

const {
  Controller,
} = require('egg');

class CooperatorController extends Controller {
  /**
   * 新增 cooperator
   *
   * @memberof CooperatorController
   */
  async create() {
    const {
      ctx,
    } = this;
    const {
      body,
    } = this.ctx.request;
    await this.ctx.verify('schema.cooperator', body);

    const isExistend = await ctx.service.cooperator.isExsited({
      name: body.name,
    });
    ctx.error(!isExistend, '该名称已存在');

    const cooperator = await this.ctx.model.Cooperator.create(body);
    this.ctx.jsonBody = {
      data: cooperator,
    };
  }

  /**
   * 规则 - 列表
   *
   * @readonly
   * @memberof CooperatorController
   */
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
            type: {
              type: 'string',
            },
          },
          required: [],
        },
      },
    };
  }

  /**
   * 合作伙伴列表
   *
   * @memberof CooperatorController
   */
  async index() {
    const {
      ctx,
      listRule,
    } = this;
    const {
      service,
    } = ctx;
    const {
      query,
    } = ctx.request;
    const {
      limit = 10, offset = 0, sort = '-created_at', type, keyword,
    } = query;
    const {
      generateSortParam,
    } = ctx.helper.pagination;

    await this.ctx.verify(listRule, query);
    const filter = {};
    if (type) filter.type = type;
    if (keyword) {
      filter.name = {
        $regex: query.keyword,
      };
    }

    const cooperators = await service.cooperator.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    });

    this.ctx.jsonBody = {
      meta: {
        count: await service.cooperator.count(filter),
      },
      data: cooperators,
    };
  }

  /**
   * 合作伙伴详情
   *
   * @memberof CooperatorController
   */
  async get() {
    const {
      ctx,
    } = this;
    const {
      params,
      service,
    } = ctx;
    const {
      query,
    } = ctx.request;

    await ctx.verify('schema.id', params);

    const cooperation = await service.cooperator.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    // 该供应商下的材料
    const embedQuery = query.embed || '';
    const embed = {
      material: [ 'material' ].includes(embedQuery) && cooperation.type === 'SUPPLIER' ? await service.material.findMany({
        supplier: params.id,
      }) : {},
    };

    this.ctx.jsonBody = {
      embed,
      data: cooperation,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.cooperator#',
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
   * 修改合作伙伴
   *
   * @memberof CooperatorController
   */
  async update() {
    const {
      ctx,
      updateRule,
    } = this;
    const {
      query,
      body,
    } = ctx.request;
    const {
      params,
      service,
    } = ctx;

    const updateParams = Object.assign({}, query, params, body);
    await this.ctx.verify(updateRule, updateParams);

    const cooperator = await service.cooperator.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    if (updateParams) {
      await service.cooperator.update({
        _id: params.id,
      }, updateParams);
      Object.assign(cooperator, updateParams);
    }

    this.ctx.jsonBody = {
      data: cooperator,
    };
  }

  /**
   * 删除合作伙伴
   *
   * @memberof CooperatorController
   */
  async delete() {
    const {
      ctx,
    } = this;
    const {
      params,
      service,
    } = ctx;

    await ctx.verify('schema.id', params);
    const cooperator = await service.cooperator.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.cooperator.destroy({
      _id: params.id,
    });

    this.ctx.body = {
      data: cooperator,
    };
  }
}

module.exports = CooperatorController;
