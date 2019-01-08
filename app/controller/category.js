'use strict';

const {
  Controller,
} = require('egg');

class CategoryController extends Controller {

  /**
   * 新增分类
   *
   * @memberof CategoryController
   */
  async create() {
    const {
      ctx,
    } = this;
    const {
      body,
    } = ctx.request;
    await ctx.verify('schema.category', body);

    const isExistend = await ctx.service.category.isExsited({
      name: body.name,
    });
    ctx.error(!isExistend, '该名称已存在');

    const category = await this.ctx.model.Category.create(body);
    this.ctx.jsonBody = {
      data: category,
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
   * 分类列表
   *
   * @memberof CategoryController
   */
  async index() {
    const {
      ctx,
    } = this;
    const {
      service,
    } = ctx;
    const {
      query,
    } = ctx.request;
    const {
      limit = 10, offset = 0, sort = '-created_at',
    } = query;
    const {
      generateSortParam,
    } = ctx.helper.pagination;

    await this.ctx.verify(this.listRule, query);

    const filter = {};
    if (query.keyword) {
      filter.$or = [{
        name: {
          $regex: query.keyword,
        },
      },
      {
        no: {
          $regex: query.keyword,
        },
      },
      ];
    }
    const categories = await service.category.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    }, 'parent image');

    this.ctx.jsonBody = {
      meta: {
        count: await service.category.count(filter),
      },
      data: categories,
    };
  }

  /**
   * 分类详情
   *
   * @memberof CategoryController
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
    const category = await service.category.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    const embedQuery = query.embed || '';
    const embed = {
      sub: [ 'sub', 'material' ].includes(embedQuery) ? await service.category.findMany({
        parent: category.id,
      }) : {}, // eslint-disable-line
      material: [ 'sub', 'material' ].includes('material') ? await service.material.findMany({
        category: category.id,
      }) : {}, // eslint-disable-line
    };

    this.ctx.jsonBody = {
      embed,
      data: category,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.category#',
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
   * 修改分类
   *
   * @memberof CategoryController
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
    service.xss.xssFilter(body);

    const updateParams = Object.assign({}, query, params, body);
    await this.ctx.verify(updateRule, updateParams);

    const category = await service.category.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    if (category) {
      await service.category.update({
        _id: params.id,
      }, updateParams);
      Object.assign(category, updateParams);
    }

    this.ctx.jsonBody = {
      data: category,
    };
  }

  /**
   * 删除分类
   *
   * @memberof CategoryController
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
    const category = await service.category.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    const subCategory = await service.category.findMany({
      parent: category.id,
    });
    ctx.error(subCategory.length === 0, '删除失败，该分类下存在子类');

    await service.category.destroy({
      _id: params.id,
    });
    this.ctx.body = {
      data: category,
    };
  }
}

module.exports = CategoryController;
