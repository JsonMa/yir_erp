const Service = require('../lib/DBService')
const path = require('path')
const fs = require('fs')
const _ = require('underscore')

class ProductService extends Service {
  constructor (ctx) {
    super(ctx, 'Product')
  }

  async create (body) {
    const { innerOnenet } = this.config
    const { service } = this

    const user = await service.accountPassport.findOne({ account_id: body.user_id })

    const product = {
      name: body.name,
      protocol: 3, // MQTT
      user_id: user.id
    }

    let ret = await service.util.onenetRequest(`${innerOnenet.server}/products?user_id=${user.id}`, {
      method: 'POST',
      data: product
    }, '[OneNET] 创建产品失败')

    body.id = ret.product_id
    body.policies = ret.policies

    ret = await super.create(body)

    // 创建虚拟设备鉴权
    await service.connectionAuthVirtural.createAuth(ret.id)

    return ret
  }

  async destroy (options, multiple = false, force = false) {
    const { config, service } = this
    const { innerOnenet } = config

    const products = await this.findMany(options)
    await super.destroy(options, multiple, force)
    const len = multiple ? products.length : 1
    for (let i = 0; i < len; ++i) {
      try {
        await this.destroyProductRelated(products[i]._id)
        await service.util.onenetRequest(`${innerOnenet.server}/products/${products[i].id}`, {
          method: 'DELETE'
        }, '[OneNET] 删除产品失败')
      } catch (err) {
        this.ctx.logger.error(err)
      }
    }
  }

  async updateMeta (id, body) {
    const { ctx, service, config } = this
    const { innerOnenet } = config

    const product = await this.findById(id).catch(err => {
      ctx.assert(!err, 404)
    })
    const user = await service.accountPassport.findOne({ account_id: product.user_id })
    const onenetProduct = {
      name: body.name,
      protocol: 3, // MQTT
      user_id: user.id
    }

    await service.util.onenetRequest(`${innerOnenet.server}/products/${product.id}`, {
      method: 'PUT',
      data: onenetProduct
    }, '[OneNET] 修改产品失败')

    const metaProduct = {
      name: body.name,
      model: body.model
    }

    await this.update({_id: id}, metaProduct)

    return metaProduct
  }

  async updateSales (id, body) {
    const product = await this.ctx.service.product.findById(id)
    const fromStatus = product.on_sales === true ? 'on_sales' : 'off_sales'
    const toStatus = body.on_sales === true ? 'on_sales' : 'off_sales'
    const adminHandleLogBody = {
      product_id: id,
      user_id: this.ctx.auth.account_id,
      from_status: fromStatus,
      to_status: toStatus,
      instruction: body.instruction
    }

    await this.ctx.service.adminHandleLog.create(adminHandleLogBody)
    const salesProduct = {
      on_sales: body.on_sales
    }
    if (toStatus === 'on_sales') {
      await this.ctx.service.notification.send({
        recipients: [product.user_id],
        subject: '上架通知',
        content: `您的[${product.name}]产品已被上架，设备绑定限制已被取消，新用户（消费者）可绑定设备，如需更多帮助请联系我公司业务人员。`
      })
    }
    if (toStatus === 'off_sales') {
      await this.ctx.service.notification.send({
        recipients: [product.user_id],
        subject: '下架通知',
        content: `您的[${product.name}]产品已被下架，设备绑定权限已被限制，新用户（消费者）无法绑定设备，如需更多帮助请联系我公司业务人员。`
      })
    }

    await this.update({_id: id}, salesProduct)
    await this.ctx.service.category.clearCache(true)

    return salesProduct
  }

  async updateDebugDev (id, body) {
    const debugDevProduct = {
      debug_devices: body.debug_devices
    }

    await this.update({_id: id}, debugDevProduct)

    return debugDevProduct
  }

  async updateMaxDev (id, body) {
    const maxDevProduct = {
      max_devices: body.max_devices
    }

    await this.update({_id: id}, maxDevProduct)

    return maxDevProduct
  }

  async getPermission (id, checkStep) {
    const { ctx, service } = this

    let permission = {
      definition: true,
      template: true,
      debugging: true,
      configuration: true,
      prodcution: false
    }
    switch (checkStep) {
      default:
        ctx.error(false, `无此step[${checkStep}]`)

      case 'definition':
        const hasFn = await service.function.findOne({product_id: id})
        if (!hasFn) {
          await service.app.update({product_id: id}, {development: null})
          permission.template = false
          permission.debugging = false
          permission.configuration = false
          break
        }

      case 'template':
        const app = await service.app.findOne({product_id: id})
        permission.debugging = Boolean(app && (app.development || app.production))
        permission.configuration = permission.debugging // TODO: 添加真实设备后开启
        if (!permission.debugging) break

      case 'configuration':
        const config = await service.config.findOne({product_id: id})
        permission.prodcution = Boolean(config)
    }
    return permission
  }

  async getSdk (id) {
    const { ctx, service } = this

    const product = await this.findById(id).catch(err => {
      ctx.error(!err, 404)
    })

    let refresh = this.ctx.request.query.refresh
    let file
    if (!(refresh === 'true') && product.sdk) {
      file = await service.file.findById(product.sdk).catch(err => {
        ctx.error(!err, 404)
      })

      // 如果SDK 文件有更新，且更新时间晚于已生成SDK的时间，重新生成SDK
      let filePath = path.join(process.cwd(), '/app/sdk/mcu_sdk_tpl_online/product_info.h')
      if (this.isSdkUpdate(filePath, file.created_at)) {
        file = await service.mcuSdk.generate(product._id)
        await this.update({_id: product._id}, {sdk: file._id})
      }
    } else {
      file = await service.mcuSdk.generate(product._id)
      await this.update({_id: product._id}, {sdk: file._id})
    }

    return file
  }

  async getSocSdk (id) {
    const { ctx, service } = this

    const product = await this.findById(id).catch(err => {
      ctx.error(!err, 404)
    })

    let refresh = this.ctx.request.query.refresh
    let file
    if (!(refresh === 'true') && product.soc_sdk) {
      file = await service.file.findById(product.soc_sdk).catch(err => {
        ctx.error(!err, 404)
      })

      // 如果SDK 文件有更新，且更新时间晚于已生成SDK的时间，重新生成SDK
      let filePath = path.join(process.cwd(), '/app/sdk/soc_sdk_tpl_online/app/hewu_app/product_info.h')
      if (this.isSdkUpdate(filePath, file.created_at)) {
        file = await service.mcuSdk.generate(product._id, 'SOC')
        await this.update({_id: product._id}, {soc_sdk: file._id})
      }
    } else {
      file = await service.mcuSdk.generate(product._id, 'SOC')
      await this.update({_id: product._id}, {soc_sdk: file._id})
    }

    return file
  }

  isSdkUpdate (filePath, sdkCreated) {
    let stat
    try {
      stat = fs.statSync(filePath)
      if (stat.mtime) {
        stat = (new Date(stat.mtime)).getTime()
      }
    } catch (err) {
      // 检测失败默认为有更新
      return true
    }

    return stat > (new Date(sdkCreated)).getTime()
  }

  async destroyProductRelated (id) {
    // 删除app和template
    const apps = await this.service.app.findMany({ product_id: id })
    await this.service.app.destroy({ product_id: id }, false, true)
    await this.service.template.destroy({ app_id: { $in: apps.map(a => a._id) } }, false, true)

    // 删除设备和relationship
    const devices = await this.service.device.findMany({ product_id: id })
    if (devices.length < 1) return
    await this.service.device.destroy({ product_id: id })
    await this.service.relationship.destroy({ device_id: { $in: devices.map(d => d._id) } })
  }

  async isOwnProduct (id) {
    if (this.ctx.auth.type === 'PASSPORT') {
      let pro = await this.findOne({_id: id, user_id: this.ctx.auth.account_id})

      this.ctx.error(pro, `产品[${id}]不存在或者不属于当前用户`)
    }
  }
  // 检测在产品最后更新后模版、功能点、等 有没有更新
  async productAnyChangeCheck (id) {
    let product = await this.findOne({_id: id})

    if (_.isEmpty(product)) return false

    // 查询最后一个该产品被拒绝的 audit
    let audit = await this.service.audit.findMany({'product.id': id, status: 'REJECTED'}, null, {sort: {updated_at: -1}, limit: 1})

    let updatedAt = product.updated_at

    if (!_.isEmpty(audit)) {
      // 有 audit 时，用最后一条 audit 被更新为未通过的时间作对比
      updatedAt = audit[0]['updated_at']
    }

    // 功能点在产品审核被拒后有无更新
    let funCount = await this.service.function.count({product_id: product._id, updated_at: {$gt: updatedAt}}, { paranoid: false })

    if (funCount > 0) return true

    // 产品的app在产品审核被拒后有无更新
    let proApp = await this.service.app.findOne({product_id: product._id})

    if (proApp && !_.isEmpty(proApp)) {
      // app 有更新
      if (Date(proApp.updated_at) > Date(updatedAt)) {
        return true
      } else {
        // 产品的app的模版样式,在产品审核被拒后,有无更新
        let tplCount = await this.service.template.count({app_id: proApp._id, updated_at: {$gt: updatedAt}})
        if (tplCount > 0) return true
      }
    }

    // 产品的app的配置信息,在产品审核被拒后,有无更新
    let configCount = await this.service.config.count({product_id: product._id, updated_at: {$gt: updatedAt}})

    if (configCount > 0) return true

    return false
  }
}

module.exports = ProductService
