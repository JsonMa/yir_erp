'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/material.test.js', () => {

  it('should add materail success', function* () {
    const pkg = require('../../../package.json');
    assert(app.config.keys.startsWith(pkg.name));

    // const ctx = app.mockContext({});
    // yield ctx.service.xx();
  });

  it('should POST /api/materials', () => {
    return app.httpRequest()
      .post('/api/materials')
      .set('Content-Type', 'application/json')
      .send({
        no: 'test_no',
        name: 'test_name',
        model: 'test_model',
        specific: 'test_model',
        supplier: 'asdfasdfasdfasdfasdfasdf',
        category: 'asdfasdfasdfasdfasdfasdf',
        marked_price: 200,
        image: 'test_image',
        remark: 'test_remak',
      })
      .expect('hi, egg')
      .expect(200);
  });
});
