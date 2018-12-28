'use strict';

const Service = require('../lib/DBService');
const _ = require('underscore');

class CategoryService extends Service {
  constructor(ctx) {
    super(ctx, 'ProductCategory');
  }

  async getList(onSales = false) {
    const { service } = this.ctx;
    const cache = this.app.productCategoryCache;
    let rootCategories = cache[onSales ? 'on_sales' : 'all'];

    if (onSales) {
      const products = await service.product.findMany({ on_sales: true }, {
        category_id: 1,
        _id: 0,
      });
      // 根据上线产品找对应的分类，如果其中出现被禁用的分类，也不予展示
      const condition = { _id: { $in: products.map(product => product.category_id) } };
      if (this.ctx.auth.type !== 'ADMIN') condition.status = { $ne: 'FORBIDDEN' };
      rootCategories = await this.findMany(condition);

      cache.on_sales = rootCategories;
    } else {
      const condition = (this.ctx.auth.type === 'ADMIN') ? {} : { status: { $ne: 'FORBIDDEN' } };
      let productCategories = await this.findMany(condition);
      productCategories = JSON.stringify(productCategories);
      productCategories = JSON.parse(productCategories);

      rootCategories = [];
      const indexedCategories = _.indexBy(productCategories, '_id');

      productCategories.forEach(category => {
        // 将有pid但是没有获取出父级数据（如禁用了父类、子类未禁用）的放进下一级if判断
        if (category.parent_id) {
          const parentCategory = indexedCategories[category.parent_id];
          if (parentCategory) {
            if (!parentCategory.children) {
              parentCategory.children = [];
            }

            parentCategory.children.push(category);
            parentCategory.children = _.sortBy(parentCategory.children, 'sort');
          }
        } else {
          rootCategories.push(category);
        }
      });

      // 非管理员，不展示没有2、3级分类的分类
      if (this.ctx.auth.type !== 'ADMIN') {
        rootCategories = _.map(rootCategories, function(cat1) {
          // 如果有2级分类，判断每个二级分类下是否有3级分类
          if (!_.isEmpty(cat1.children)) {
            cat1.children = _.map(cat1.children, function(cat2) {
              // 二级分类下有3级分类则返回这个二级分类，否则舍弃
              if (!_.isEmpty(cat2.children)) return cat2;
            });

            cat1.children = _.compact(cat1.children);

            // 再次检查 当前一级分类下是否有二级分类，有则返回 无则舍弃
            if (!_.isEmpty(cat1.children)) return cat1;
          }
        });
        rootCategories = _.compact(rootCategories);
      }
      cache.all = rootCategories;
    }

    return _.sortBy(rootCategories, 'sort');
  }

  async getDeepParentId(parentIds) {
    const categories = await this.findMany({ _id: { $in: parentIds } });

    const pidArr = [];
    _.each(categories, function(cat) {
      if (cat.parent_id) pidArr.push(cat.parent_id);
    });

    if (!_.isEmpty(pidArr)) {
      return _.union(parentIds, await this.getDeepParentId(pidArr));
    }
    return parentIds;

  }

  async getDeepPChildrenId(ids) {
    const childrenCat = await this.findMany({ parent_id: { $in: ids } });
    const children = [];
    const grandchildren = [];

    _.each(childrenCat, function(cat) {
      children.push(cat._id.toString());
    });

    if (!_.isEmpty(children)) {
      const grandchildrenCat = await this.findMany({ parent_id: { $in: children } });
      _.each(grandchildrenCat, function(cat) {
        grandchildren.push(cat._id.toString());
      });
    }

    return _.union(children, grandchildren);
  }

  async clearCache(onSales = false) {
    this.app.productCategoryCache[(onSales ? 'on_sales' : 'all')] = null;
  }

  async isParentUsing(cat) {
    if (cat.parent_id) {
      const parCat = await this.findOne({ _id: cat.parent_id });
      return !!(parCat && parCat.status === 'USING');
    }
    return true;
  }
}

module.exports = CategoryService;
