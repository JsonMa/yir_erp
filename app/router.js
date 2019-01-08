'use strict';

const path = require('path');
const fs = require('fs');

module.exports = app => {
  const {
    router,
    controller,
  } = app;
  const prefix = app.config.prefix || '';

  // auth
  router.post(`${prefix}/api/auth/login`, controller.auth.login);
  router.post(`${prefix}/api/auth/logout`, controller.auth.logout);

  // account
  router.get(`${prefix}/api/accounts`, controller.account.index);
  router.post(`${prefix}/api/accounts`, controller.account.create);
  router.get(`${prefix}/api/accounts/:id`, controller.account.get);
  router.patch(`${prefix}/api/accounts/:id`, controller.account.update);
  router.delete(`${prefix}/api/accounts/:id`, controller.account.delete);

  // department
  router.get(`${prefix}/api/departments`, controller.department.index);
  router.post(`${prefix}/api/departments`, controller.department.create);
  router.get(`${prefix}/api/departments/:id`, controller.department.get);
  router.patch(`${prefix}/api/departments/:id`, controller.department.update);
  router.delete(`${prefix}/api/departments/:id`, controller.department.delete);

  // file
  router.get(`${prefix}/api/files/:id`, controller.file.index);
  router.post(`${prefix}/api/files`, controller.file.upload);
  router.put(`${prefix}/api/files/:id`, controller.file.update);
  router.delete(`${prefix}/api/files/:id`, controller.file.delete);
  router.get(`${prefix}/api/files/csrf/token`, controller.file.token);


  // category
  router.get(`${prefix}/api/categories`, controller.category.index);
  router.post(`${prefix}/api/categories`, controller.category.create);
  router.get(`${prefix}/api/categories/:id`, controller.category.get);
  router.patch(`${prefix}/api/categories/:id`, controller.category.update);
  router.delete(`${prefix}/api/categories/:id`, controller.category.delete);

  // material
  router.get(`${prefix}/api/materials`, controller.material.index);
  router.post(`${prefix}/api/materials`, controller.material.create);
  router.get(`${prefix}/api/materials/:id`, controller.material.get);
  router.patch(`${prefix}/api/materials/:id`, controller.material.update);
  router.delete(`${prefix}/api/materials/:id`, controller.material.delete);


  // material_entry
  router.get(`${prefix}/api/material_entries`, controller.materialEntry.index);
  router.post(`${prefix}/api/material_entries`, controller.materialEntry.create);
  router.get(`${prefix}/api/material_entries/:id`, controller.materialEntry.get);
  router.patch(`${prefix}/api/material_entries/:id`, controller.materialEntry.update);
  router.delete(`${prefix}/api/material_entries/:id`, controller.materialEntry.delete);


  // material_out
  router.get(`${prefix}/api/material_outs`, controller.materialOut.index);
  router.post(`${prefix}/api/material_outs`, controller.materialOut.create);
  router.get(`${prefix}/api/material_outs/:id`, controller.materialOut.get);
  router.patch(`${prefix}/api/material_outs/:id`, controller.materialOut.update);
  router.delete(`${prefix}/api/material_outs/:id`, controller.materialOut.delete);

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
