const Service = require('../lib/DBService')
const _ = require('underscore')
const VError = require('verror')
const moment = require('moment')

class UserService extends Service {
  constructor (ctx) {
    super(ctx, 'Account')
  }

  async platformAccountDetail (query, queryPara) {
    const { ctx, service } = this
    const { generateSortParam } = ctx.helper.pagination
    const { EMONGODB } = this.app.errors
    const { AccountPassport } = this.ctx.model
    const { limit = 10, offset = 0, sort = '-created_at' } = query
    const para = _.pick(query, 'name', 'company', 'user_id', 'tel', 'product_id', 'register_from', 'register_to')

    // type 为 platform 时条件有（开发者ID、开发者名、电话(上面已处理)、公司名称之一），注册开始、结束时间
    if (para.user_id) {
      queryPara.account_id = para.user_id
    }
    if (para.name) {
      queryPara.name = {$regex: para.name}
    }
    if (para.company) {
      queryPara['enterprise.name'] = {$regex: para.company}
    }
    if (para.register_from || para.register_to) {
      let createdAt = {}
      if (para.register_from) {
        createdAt = {'$gte': para.register_from.length > 10 ? para.register_from : (new Date(para.register_from + ' 00:00:00')).toISOString()}
      }
      if (para.register_to) {
        createdAt = _.extend(createdAt, {'$lte': para.register_to.length > 10 ? para.register_to : moment(para.register_to).endOf('day').format()})
      }
      if (!_.isEmpty(createdAt)) {
        queryPara.created_at = createdAt
      }
    }

    let userCount = await service.accountPassport.count(queryPara)
    let userList = await AccountPassport.find(queryPara, '-password', {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort) })
      .populate('account_id')
      .catch(error => {
        throw new VError(
          {
            name: EMONGODB,
            cause: error
          },
          '开发者列表查询失败 '
        )
      })

    return {
      userCount: userCount,
      userList: userList
    }
  }

  async platformProductCount (userList) {
    const { Product } = this.ctx.model

    let accountIds = []

    userList = _.map(userList, function (user) {
      // 因为 populate 的植入，user 中的 account_id 是一个 account 对象，因为这里逻辑上是必然存在的所以不做存在判断
      let account = user.account_id
      user = user.toObject()
      user.account_id = account._id
      user.tel = account.tel
      accountIds.push(user.account_id)
      return user
    })

    let productInfo = await Product.aggregate()
      .match({user_id: {$in: accountIds}, deleted_at: {$exists: false}})
      .group({_id: '$user_id', count: {'$sum': 1}})

    let protCountObj = {}

    _.each(productInfo, function (prot) {
      protCountObj[prot._id] = prot.count
    })

    userList = _.map(userList, function (user) {
      user.product_count = protCountObj[user.account_id] ? protCountObj[user.account_id] : 0
      return user
    })

    return userList
  }

  async appUserDetail (query, queryPara) {
    // TODO 这个方法后期待优化，建议从业务出发
    const { ctx } = this
    const { generateSortParam } = ctx.helper.pagination
    const { EMONGODB } = this.app.errors
    const { AccountApp } = this.ctx.model
    const { limit = 10, offset = 0, sort = '-created_at' } = query
    const para = _.pick(query, 'name', 'company', 'user_id', 'tel', 'product_id', 'register_from', 'register_to')

    // 因为这里要款两个集合分页
    // 无条件、只有注册时间段时通过account分页，不限制总条数
    // 有多个条件时，现获取总条数，多余100条，提示输入更精确条件，以便两个集合查到结果后在内存中分页，不至于占用太多资源
    if (para.user_id) {
      queryPara.account_id = para.user_id
    }
    if (para.name) {
      // APP用户只有 nickname 昵称，没有 name 名称
      queryPara.nickname = {$regex: para.name}
    }

    if (para.register_from || para.register_to) {
      let createdAt = {}
      if (para.register_from) {
        createdAt = {'$gte': para.register_from.length > 10 ? para.register_from : (new Date(para.register_from + ' 00:00:00')).toISOString()}
      }
      if (para.register_to) {
        createdAt = _.extend(createdAt, {'$lte': para.register_to.length > 10 ? para.register_to : moment(para.register_to).endOf('day').format()})
      }
      if (!_.isEmpty(createdAt)) {
        queryPara.created_at = createdAt
      }
    }

    // 因为和通行证用户与APP用户已经合并到同一个用户中，这里省去复杂的跨表分页问题

    let userCount = await AccountApp.count(queryPara)

    let userList = await AccountApp.find(queryPara, '-password', {
      limit: parseInt(limit),
      skip: parseInt(offset),
      sort: generateSortParam(sort)})
      .populate('account_id')
      .catch(error => {
        throw new VError(
          {
            name: EMONGODB,
            cause: error
          },
          '移动APP用户列表查询失败 '
        )
      })

    userList = _.map(userList, function (user) {
      // 因为 populate 的植入，user 中的 account_id 是一个 account 对象，因为这里逻辑上是必然存在的所以不做存在判断
      let account = user.account_id
      if (!_.isEmpty(account)) {
        user = user.toObject()
        user.account_id = account._id
        user.tel = account.tel
      }
      return user
    })

    return {
      userList: userList,
      userCount: userCount
    }
  }

  async appUserDeviceCount (userList, deviceIds) {
    const { Relationship } = this.ctx.model
    let accountIds = _.map(userList, function (user) {
      return user.account_id
    })
    let condition = {owner_id: {$in: accountIds}, deleted_at: null, user_id: null, type: {$ne: 'DEBUG'}}
    if (deviceIds) {
      condition.device_id = {$in: deviceIds}
    }
    // 通过设备关系，统计设备数, aggregate 中以ID为条件的值需要注意手动转化为objectID的形式
    let deviceInfo = await Relationship.aggregate()
      .match(condition)
      .group({_id: '$owner_id', count: {'$sum': 1}})

    let deviceCountObj = {}
    _.each(deviceInfo, function (device) {
      deviceCountObj[device._id] = device.count
    })

    userList = _.map(userList, function (user) {
      user.device_count = deviceCountObj[user.account_id] ? deviceCountObj[user.account_id] : 0
      return user
    })

    return userList
  }

  // dataList 含有accountId 对象的数组，keyForAccountId accountId 对应的 key
  async getUserInfoInArray (dataList, keyForAccountId) {
    const { service } = this.ctx

    let accountIds = []
    _.each(dataList, function (obj) {
      accountIds = _.union(accountIds, [obj[keyForAccountId]])
    })

    let accountList = await service.account.findMany({_id: {$in: accountIds}})

    let serviceArr = ['accountAdmin', 'accountApp', 'accountHePassport', 'accountPassport']

    let functionList = []
    _.each(serviceArr, function (num) {
      functionList.push(service[num].findMany({account_id: {$in: accountIds}}, '-password'))
    })

    let accountDetailArr = await Promise.all(functionList)

    accountList = _.indexBy(accountList, '_id')

    accountDetailArr = _.flatten(accountDetailArr)

    accountDetailArr = _.map(accountDetailArr, function (accountDetail) {
      accountDetail = accountDetail.toObject()
      accountDetail.type = accountList[accountDetail.account_id] ? accountList[accountDetail.account_id].type : ''

      // 屏蔽管理员敏感信息
      if (accountDetail.type === 'ADMIN') delete accountDetail.name
      else accountDetail.tel = accountList[accountDetail.account_id] ? accountList[accountDetail.account_id].tel : ''

      return accountDetail
    })

    return accountDetailArr
  }

  async productForDevices (deviceList) {
    const { service } = this.ctx

    let productIds = []
    _.each(deviceList, function (device) {
      productIds.push(device.product_id)
    })

    let productList = await service.product.findMany({_id: {$in: _.uniq(productIds)}})

    let categoryIds = []
    _.each(productList, function (product) {
      categoryIds.push(product.category_id)
    })

    let categoryList = await service.category.findMany({_id: {$in: _.uniq(categoryIds)}})

    categoryList = _.indexBy(categoryList, '_id')

    productList = _.map(productList, function (product) {
      product = product.toObject()
      product.categoryName = categoryList[product.category_id] ? categoryList[product.category_id].name : ''
      product = _.pick(product, 'name', 'category_id', 'categoryName', '_id', 'id', 'model')
      return product
    })

    return productList
  }
}

module.exports = UserService
