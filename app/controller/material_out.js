'use strict';

const {
  Controller,
} = require('egg');
const uuid = require('uuid');


class MaterialOutController extends Controller {
  /**
   * 新增材料出库单
   *
   * @memberof MaterialOutController
   */
  async create() {

    const {
      ctx,
    } = this;
    const {
      body,
    } = ctx.request;
    await ctx.verify('schema.materialOut', body);

    body.no = uuid(); // 生成单号
    const materialOut = await ctx.model.MaterialOut.create(body);
    this.ctx.jsonBody = {
      data: materialOut,
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
            queryAll: {
              type: 'string',
              enum: [ 'true', 'false' ],
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
      limit = 10, offset = 0, sort = '-created_at', start_time, end_time, status, queryAll, embed,
    } = query;
    const {
      generateSortParam,
    } = ctx.helper.pagination;

    await this.ctx.verify(this.listRule, Object.assign(query));

    const filter = {};
    if (query.keyword) {
      filter.$or = [{
        no: {
          $regex: query.keyword,
        },
      }];
    }

    if (start_time && end_time) {
      filter.created_at = {
        $gte: new Date(start_time),
        $lte: new Date(end_time),
      };
    }
    if (status) filter.status = status;
    const materialOuts = await service.materialOut.findMany(filter, null, {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort),
    }, 'maker applicant reviewer');

    // embed注入
    const materialIds = [];
    const departmentIds = [];
    if (embed.includes('material')) {
      materialOuts.forEach(item => {
        if (item.applicant) departmentIds.push(item.applicant.department);
        item.materials.forEach(material => {
          materialIds.push(material.material);
        });
      });
      const materials = await service.material.findMany({
        _id: {
          $in: materialIds,
        },
      },
      null, {
        paranoid: false,
      }, 'supplier');

      // 构造map结构
      const mapMaterials = {};
      materials.forEach(material => {
        mapMaterials[material.id] = material;
      });

      // material替代原有数据
      materialOuts.forEach(out => {
        out.materials.forEach(item => {
          item.material = mapMaterials[item.material];
        });
      });
    }

    if (embed.includes('department')) {
      const departments = await service.department.findMany({
        _id: {
          $in: departmentIds,
        },
      },
      null, {
        paranoid: false,
      });
      if (departments) {
        const mapDepartments = {};
        departments.forEach(department => {
          mapDepartments[department.id] = department;
        });
        materialOuts.forEach(out => {
          if (out.applicant) {
            out.applicant.department = mapDepartments[out.applicant.department];
          }
        });
      }
    }
    const meta = {
      count: await service.materialOut.count(filter),
    };
    if (queryAll === 'true') {
      meta.allCount = await service.materialOut.count();
    }

    this.ctx.jsonBody = {
      meta,
      data: materialOuts,
    };
  }

  /**
   * 材料出库单详情
   *
   * @memberof MaterialOutController
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
    const materialOut = await service.materialOut.findById(params.id, 'maker applicant reviewer');
    this.ctx.jsonBody = {
      data: materialOut,
    };
  }

  get updateRule() {
    return {
      $merge: {
        source: {
          $ref: 'schema.materialOut#',
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

    const materialOut = await service.materialOut.findById(params.id, 'material buyer reviewer inspector').catch(err => {
      ctx.error(!err, 404);
    });

    if (status === 'PASSED') {

      // TODO 验证权限是否为“财务”及以上
      const {
        materials,
      } = materialOut;

      // materials去重,得到实际申请的材料
      const appliedMaterails = {};
      materials.forEach(item => {
        const {
          material,
          count,
        } = item;
        if (appliedMaterails[material]) appliedMaterails[material].applicantCount += count;
        else {
          appliedMaterails[material] = {
            applicantCount: count,
          };
        }
      });

      // 获取所有被申请的材料信息
      const real_materials = await service.material.findMany({
        _id: {
          $in: Object.keys(appliedMaterails),
        },
      }, null);

      // 剩余数量验证
      real_materials.forEach(item => {
        // 实际剩余数量
        const {
          _id,
          left_num,
          total_num,
          name,
        } = item;
        ctx.error(left_num >= appliedMaterails[_id].applicantCount, `出库失败，商品：${name}， 库存数少于申请数量`);
        appliedMaterails[_id].leftCount = left_num;
        appliedMaterails[_id].totalCount = total_num;
      });

      // 修改库存数量
      await Promise.all(
        Object.keys(appliedMaterails).map(materialId => {
          const {
            applicantCount,
            leftCount,
            totalCount,
          } = appliedMaterails[materialId];
          const total_num = totalCount - applicantCount;
          const left_num = leftCount - applicantCount;
          return service.material.update({
            _id: materialId,
          }, {
            total_num,
            left_num,
          });
        }));

      // 修改材料剩余库存
      updateParams.materials = materialOut.materials;
      materialOut.materials.forEach(item => {
        item.left_count = appliedMaterails[item.material].leftCount;
      });
    }

    await service.materialOut.update({
      _id: params.id,
    }, updateParams);
    Object.assign(materialOut, updateParams);

    this.ctx.jsonBody = {
      data: materialOut,
    };
  }

  /**
   * 删除材料出库单
   *
   * @memberof MaterialOutController
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
    const materialOut = await service.materialOut.findById(params.id).catch(err => {
      ctx.error(!err, 404);
    });

    await service.materialOut.destroy({
      _id: params.id,
    });

    this.ctx.body = {
      data: materialOut,
    };
  }
}

module.exports = MaterialOutController;
