'use strict';
const {
  Service,
} = require('egg');
const VError = require('verror');

class DBService extends Service {
  constructor(ctx, type) {
    super(ctx);
    const {
      EAPPLICATION,
    } = this.app.errors;

    ctx.assert(
      ctx.model[type],
      new VError({
        name: EAPPLICATION,
        info: {
          type,
        },
      },
      `实例化service失败, model中未找到 [${type}] `
      )
    );
    this.type = type;
  }
  async findByIds(ids, populates = '') {
    let _ids = ids.filter(id => id);
    _ids = Array.from(new Set(_ids.map(id => id.toString())));

    const {
      EAPPLICATION,
    } = this.app.errors;
    try {
      return await this.app.model[this.type].find({
        _id: {
          $in: _ids,
        },
      }).populate(populates);
    } catch (e) {
      throw new VError({
        name: EAPPLICATION,
        case: e,
        info: {
          ids: _ids,
        },
      },
      '查询数据不存在'
      );
    }
  }

  async findById(id, populates = '') {
    const {
      EAPPLICATION,
    } = this.app.errors;
    try {
      return await this.app.model[this.type].findById(id).populate(populates);
    } catch (e) {
      throw new VError({
        name: EAPPLICATION,
        case: e,
        info: {
          id,
        },
      },
      '查询数据不存在'
      );
    }
  }

  async findOne(conditions, fields = null, options = {
    paranoid: true,
  }, populates = '') {
    const {
      EMONGODB,
    } = this.app.errors;
    if (Object.keys(options).indexOf('paranoid') === -1) options.paranoid = true;
    const query = options.paranoid ?
      Object.assign({
        deleted_at: null,
      }, conditions) :
      conditions;
    const date = await this.app.model[this.type].findOne(query, fields).populate(populates).catch(error => {
      throw new VError({
        name: EMONGODB,
        cause: error,
        info: {
          query,
        },
      },
      '[%s] 查询失败 ',
      this.type
      );
    });
    return date;
  }

  async findMany(conditions, fields = null, options = {
    paranoid: true,
  }, populates = '') {
    const {
      EMONGODB,
    } = this.app.errors;
    if (Object.keys(options).indexOf('paranoid') === -1) options.paranoid = true;
    const query = options.paranoid ?
      Object.assign({
        deleted_at: null,
      }, conditions) :
      conditions;
    const items = await this.app.model[this.type]
      .find(query, fields, options)
      .populate(populates)
      .catch(error => {
        throw new VError({
          name: EMONGODB,
          cause: error,
          info: {
            query,
          },
        },
        '[%s] 查询失败 ',
        this.type
        );
      });
    return items;
  }

  async isExsited(conditions, options = {
    paranoid: true,
  }) {
    const results = await this.app.model[this.type].find(conditions, null, options);
    return results.length >= 1;
  }

  async count(conditions, options = {
    paranoid: true,
  }) {
    const {
      EMONGODB,
    } = this.app.errors;
    if (Object.keys(options).indexOf('paranoid') === -1) options.paranoid = true;
    const query = options.paranoid ?
      Object.assign({
        deleted_at: null,
      }, conditions) :
      conditions;
    const count = await this.app.model[this.type]
      .find(query)
      .count()
      .catch(error => {
        throw new VError({
          name: EMONGODB,
          cause: error,
          info: {
            query,
          },
        },
        '[%s] 查询失败 ',
        this.type
        );
      });
    return count;
  }

  async create(data) {
    const {
      EMONGODB,
    } = this.app.errors;
    const item = await this.ctx.model[this.type].create(Object.assign({
      created_at: new Date(),
    }, data)).catch(error => {
      throw new VError({
        name: EMONGODB,
        cause: error,
        info: data,
      },
      `[${this.type}] 创建失败`
      );
    });
    return item;
  }

  async insertMany(data) {
    const {
      EMONGODB,
    } = this.app.errors;
    const item = await this.ctx.model[this.type]
      .insertMany(data)
      .catch(error => {
        throw new VError({
          name: EMONGODB,
          cause: error,
          info: data,
        },
        `[${this.type}] 创建失败`
        );
      });
    return item;
  }

  async update(options, values, multiple = false) {
    const {
      EMONGODB,
    } = this.app.errors;
    const vals = Object.assign({
      updated_at: new Date(),
    }, values);
    const items = await this.ctx.model[this.type][multiple ? 'updateOne' : 'updateMany'](options, {
      $set: vals,
    })
      .catch(error => {
        throw new VError({
          name: EMONGODB,
          cause: error,
          info: options,
        },
        `[${this.type}] 删除失败`
        );
      });

    return items;
  }

  async destroy(options, multiple = false, force = false) {
    const {
      EMONGODB,
    } = this.app.errors;
    let ret;
    if (force) {
      ret = await this.ctx.model[this.type][multiple ? 'deleteOne' : 'deleteMany'](options)
        .catch(error => {
          throw new VError({
            name: EMONGODB,
            cause: error,
            info: options,
          },
          `[${this.type}] 删除失败`
          );
        });
    } else {
      ret = await this.ctx.model[this.type]
        .update(
          options, {
            deleted_at: new Date(),
          }, {
            multi: true,
          }
        )
        .catch(error => {
          throw new VError({
            name: EMONGODB,
            cause: error,
            info: options,
          },
          `[${this.type}] 删除失败`
          );
        });
    }
    return ret;
  }
}

module.exports = DBService;
