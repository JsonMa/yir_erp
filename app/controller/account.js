'use strict';

const {
  Controller,
} = require('egg');
const crypto = require('crypto');

class AccountController extends Controller {

  /**
   * 新增用户
   *
   * @memberof AccountController
   */
  async create() {
    const {
      ctx,
    } = this;
    const {
      body,
    } = ctx.request;
    const {
      name,
      password,
    } = body;
    await ctx.verify('schema.account', body);

    const isExistend = await ctx.service.account.isExsited({
      name: body.name,
    });
    ctx.error(!isExistend, '该名称已存在');

    body.password = crypto.createHash('sha1').update(password || `cqyir_${name}`).digest('hex');
    const account = await ctx.service.account.create(body);
    this.ctx.jsonBody = {
      data: account,
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
   * 用户列表
   *
   * @memberof AccountController
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
    const accounts = await service.account.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    }, 'parent image');

    this.ctx.jsonBody = {
      meta: {
        count: await service.account.count(filter),
      },
      data: accounts,
    };
  }

  /**
   * 用户详情
   *
   * @memberof AccountController
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
    const account = await service.account.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    const embedQuery = query.embed || '';
    const embed = {
      materail_entry: [ 'materail_entry' ].includes(embedQuery) ? await service.materailEntry.findMany({
        $or: [{
          buyer: {
            $regex: query.keyword,
          },
        },
        {
          reviewer: {
            $regex: query.keyword,
          },
        },
        {
          inspector: {
            $regex: query.keyword,
          },
        },
        ],
      }) : {},
    };

    this.ctx.jsonBody = {
      embed,
      data: account,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.account#',
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
   * 修改用户
   *
   * @memberof AccountController
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

    const account = await service.account.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    if (account) {
      await service.department.update({
        _id: params.id,
      }, updateParams);
      Object.assign(account, updateParams);
    }

    this.ctx.jsonBody = {
      data: account,
    };
  }

  /**
   * 删除用户
   *
   * @memberof AccountController
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
    const account = await service.account.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.account.destroy({
      _id: params.id,
    });
    this.ctx.body = {
      data: account,
    };
  }
}

module.exports = AccountController;
