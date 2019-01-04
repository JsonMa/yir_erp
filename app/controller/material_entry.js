'use strict';

const {
  Controller,
} = require('egg');
const uuid = require('uuid');

class MaterialEntryController extends Controller {
  /**
   * 新增材料入库单
   *
   * @memberof MaterialEntryController
   */
  async create() {

    const {
      ctx,
    } = this;
    const {
      body,
    } = ctx.request;
    await ctx.verify('schema.materialEntry', body);
    const {
      real_count,
      per_price,
    } = body;

    body.no = uuid(); // 生成单号
    body.total_price = real_count * per_price; // 设置总价

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
            start_time: {
              type: 'string',
              format: 'date-time',
            },
            end_time: {
              type: 'string',
              format: 'date-time',
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
      limit = 10, offset = 0, sort = '-created_at', start_time, end_time, status, embed,
    } = query;
    const {
      generateSortParam,
    } = ctx.helper.pagination;

    await this.ctx.verify(this.listRule, Object.assign(query));

    // 构造查询filter
    const filter = {};
    if (query.keyword) {
      filter.$or = [{
        no: {
          $regex: query.keyword,
        },
      }];
    }
    if (status) filter.status = status;
    if (start_time && end_time) {
      filter.created_at = {
        $gte: new Date(start_time),
        $lte: new Date(end_time),
      };
    }

    const materialEntries = await service.materialEntry.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    }, 'material buyer reviewer inspector maker');

    // embed注入
    if (embed === 'material') {
      const materialIds = materialEntries.map(item => {
        return item.material.id;
      });

      const materials = await service.material.findMany({
        _id: {
          $in: materialIds,
        },
      },
      null, {}, 'supplier');

      // 构造map结构
      const mapMaterials = {};
      materials.forEach(material => {
        mapMaterials[material.id] = material;
      });

      // material替代原有数据
      materialEntries.forEach(entry => {
        entry.material = mapMaterials[entry.material.id];
      });
    }

    this.ctx.jsonBody = {
      meta: {
        count: await service.materialEntry.count(filter),
      },
      data: materialEntries,
    };
  }

  /**
   * 材料入库单详情
   *
   * @memberof MaterialEntryController
   */
  async get() {
    const {
      ctx,
    } = this;
    const {
      params,
      service,
    } = ctx;

    await ctx.verify('schema.id', params);
    const materialEntry = await service.materialEntry.findById(params.id, 'material buyer reviewer inspector maker')
      .catch(err => {
        ctx.error(!err, 404);
      });

    this.ctx.jsonBody = {
      data: materialEntry,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.materialEntry#',
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

    const {
      status,
    } = body;
    await this.ctx.verify(updateRule, updateParams);

    const materialEntry = await service.materialEntry.findById(params.id, 'material buyer reviewer inspector maker').catch(err => {
      ctx.error(!err, 404);
    });

    if (status === 'PASSED') {

      // TODO 验证权限是否为“财务”及以上
      const {
        real_count,
        material: materialId,
      } = materialEntry;
      const material = await service.material.findById(materialId, 'supplier category').catch(err => {
        ctx.error(!err, 404);
      });

      // 修改材料库数量
      let {
        total_num,
        left_num,
      } = material;
      total_num += real_count;
      left_num += real_count;

      await service.material.update({
        _id: materialId,
      }, {
        total_num,
        left_num,
      });
    }

    await service.materialEntry.update({
      _id: params.id,
    }, updateParams);
    Object.assign(materialEntry, updateParams);

    this.ctx.jsonBody = {
      data: materialEntry,
    };
  }

  /**
   * 删除材料入库单
   *
   * @memberof MaterialEntryController
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
    const materialEntry = await service.materialEntry.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.materialEntry.destroy({
      _id: params.id,
    });

    this.ctx.body = {
      data: materialEntry,
    };
  }
}

module.exports = MaterialEntryController;
