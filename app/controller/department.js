'use strict';

const {
  Controller,
} = require('egg');

class DepartmentController extends Controller {

  /**
   * 新增部门
   *
   * @memberof DepartmentController
   */
  async create() {
    const {
      ctx,
    } = this;
    const {
      body,
    } = ctx.request;
    await ctx.verify('schema.department', body);

    const isExistend = await ctx.service.department.isExsited({
      name: body.name,
    });
    ctx.error(isExistend, '该名称已存在');

    const department = await ctx.service.department.create(body);
    this.ctx.jsonBody = {
      data: department,
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
   * 部门列表
   *
   * @memberof DepartmentController
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
      }];
    }
    const departments = await service.department.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    }, 'parent image');

    this.ctx.jsonBody = {
      meta: {
        count: await service.department.count(filter),
      },
      data: departments,
    };
  }

  /**
   * 部门详情（该部门所有用户）
   *
   * @memberof DepartmentController
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
    const department = await service.department.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    const embedQuery = query.embed || '';
    const embed = {
      accounts: !~embedQuery.indexOf('account') ? {} : await service.account.findMany({
        department: department.id,
      }), // eslint-disable-line
    };

    this.ctx.jsonBody = {
      embed,
      data: department,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.department#',
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
   * 修改部门
   *
   * @memberof DepartmentController
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

    const department = await service.department.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    if (department) {
      await service.department.update({
        _id: params.id,
      }, updateParams);
      Object.assign(department, updateParams);
    }

    this.ctx.jsonBody = {
      data: department,
    };
  }

  /**
   * 删除部门
   *
   * @memberof DepartmentController
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
    const department = await service.department.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    const accounts = await service.account.findMany({
      department: department.id,
    });
    ctx.error(accounts.length === 0, '删除失败，该分类下存在子类');

    await service.department.destroy({
      _id: params.id,
    });
    this.ctx.body = {
      data: department,
    };
  }
}

module.exports = DepartmentController;
