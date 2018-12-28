'use strict';

const path = require('path');
const fs = require('fs');

module.exports = app => {
  const { router, controller } = app;
  const prefix = app.config.prefix || '';

  // account
  // router.post(`${prefix}/api/auth/password`, controller.auth.editPassword);
  // router.get(`${prefix}/api/auth/captcha`, controller.auth.generateCaptcha);
  // router.post(`${prefix}/api/auth/authcode`, controller.auth.sendAuthcode);
  // router.post(`${prefix}/api/auth/register`, controller.auth.register);
  // router.post(`${prefix}/api/auth/login`, controller.auth.login);
  // router.post(`${prefix}/api/auth/logout`, controller.auth.logout);
  // router.post(`${prefix}/api/authcode/:id`, controller.auth.authcodeVerify);

  // category
  router.get(`${prefix}/api/categories`, controller.category.index);
  router.post(`${prefix}/api/categories`, controller.category.create);
  router.get(`${prefix}/api/categories/:id`, controller.category.get);
  router.patch(`${prefix}/api/categories/:id`, controller.category.update);
  router.delete(`${prefix}/api/categories/:id`, controller.category.delete);

  // department
  // router.get(`${prefix}/api/departments`, controller.department.index);
  // router.post(`${prefix}/api/departments`, controller.department.create);
  // router.get(`${prefix}/api/departments/:id`, controller.department.get);
  // router.patch(`${prefix}/api/departments/:id`, controller.department.update);
  // router.delete(`${prefix}/api/departments/:id`, controller.department.delete);

  // file
  router.get(`${prefix}/api/files/:id`, controller.file.index);
  router.post(`${prefix}/api/files`, controller.file.upload);
  router.put(`${prefix}/api/files/:id`, controller.file.update);
  router.delete(`${prefix}/api/files/:id`, controller.file.delete);
  router.get(`${prefix}/api/files/csrf/token`, controller.file.token);

  // material_entry
  // router.get(`${prefix}/api/material_entries`, controller.material_entry.index);
  // router.post(`${prefix}/api/material_entries`, controller.material_entry.create);
  // router.get(`${prefix}/api/material_entries/:id`, controller.material_entry.get);
  // router.patch(`${prefix}/api/material_entries/:id`, controller.material_entry.update);
  // router.delete(`${prefix}/api/material_entries/:id`, controller.material_entry.delete);


  // // material_out
  // router.get(`${prefix}/api/material_outs`, controller.material_out.index);
  // router.post(`${prefix}/api/material_outs`, controller.material_out.create);
  // router.get(`${prefix}/api/material_outs/:id`, controller.material_out.get);
  // router.patch(`${prefix}/api/material_outs/:id`, controller.material_out.update);
  // router.delete(`${prefix}/api/material_outs/:id`, controller.material_out.delete);

  // material
  router.get(`${prefix}/api/materials`, controller.material.index);
  router.post(`${prefix}/api/materials`, controller.material.create);
  router.get(`${prefix}/api/materials/:id`, controller.material.get);
  router.patch(`${prefix}/api/materials/:id`, controller.material.update);
  router.delete(`${prefix}/api/materials/:id`, controller.material.delete);

  // product_entry
  // router.get(`${prefix}/api/product_entries`, controller.product_entry.index);
  // router.post(`${prefix}/api/product_entries`, controller.product_entry.create);
  // router.get(`${prefix}/api/product_entries/:id`, controller.product_entry.get);
  // router.patch(`${prefix}/api/product_entries/:id`, controller.product_entry.update);
  // router.delete(`${prefix}/api/product_entries/:id`, controller.product_entry.delete);

  // product
  // router.get(`${prefix}/api/products`, controller.product.index);
  // router.post(`${prefix}/api/products`, controller.product.create);
  // router.get(`${prefix}/api/products/:id`, controller.product.get);
  // router.patch(`${prefix}/api/products/:id`, controller.product.update);
  // router.delete(`${prefix}/api/products/:id`, controller.product.delete);

  // cooperator
  router.get(`${prefix}/api/cooperators`, controller.cooperator.index);
  router.post(`${prefix}/api/cooperators`, controller.cooperator.create);
  router.get(`${prefix}/api/cooperators/:id`, controller.cooperator.get);
  router.patch(`${prefix}/api/cooperators/:id`, controller.cooperator.update);
  router.delete(`${prefix}/api/cooperators/:id`, controller.cooperator.delete);

  // website
  router.get('/', async ctx => {
    const fpath = path.join(__dirname, './public/website/index.html');
    ctx.set('Content-Type', 'text/html');
    ctx.body = fs.createReadStream(fpath);
  });
};
