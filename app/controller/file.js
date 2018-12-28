'use strict';

const { Controller } = require('egg');

class FileController extends Controller {
  async upload() {
    const { ctx } = this;
    const { File } = ctx.model;
    const { data, fid } = await ctx.service.fs.upload();
    const file = new File({
      name: data.name,
      size: data.size,
      fid,
      type: data.type,
    });
    const savedFile = await file.save();
    ctx.body = savedFile;
  }

  get indexRule() {
    return {
      properties: {
        id: {
          $ref: 'schema.definition#/oid',
        },
        action: {
          type: 'string',
          enum: [ 'info', 'file' ],
        },
      },
      $async: true,
      required: [ 'id', 'action' ],
      additionalProperties: false,
    };
  }

  async index() {
    const { ctx, indexRule } = this;
    const { File } = ctx.model;
    const { params } = ctx;
    const { query } = ctx.request;
    await ctx.verify(indexRule, Object.assign({}, params, query));

    const file = await File.findById(params.id);
    ctx.assert(file, 404, '文件不存在');

    const { action } = query;
    if (action === 'info') {
      ctx.jsonBody = {
        data: file,
      };
    } else {
      const result = await ctx.service.fs.download(file.fid);

      if (file.type === 'application/octet-stream') {
        const nameArr = file.name.split('.');
        const fileName = nameArr[nameArr.length - 1];
        if (nameArr.length > 1 && /^[a-zA-Z]+$/.test(fileName)) {
          ctx.set('Content-Disposition', `attachment;filename=${file._id}.${fileName}`);
        }
      }

      if (file.type.startsWith('image')) {
        ctx.set('Cache-Control', 'max-age=31536000');
      }

      ctx.body = result.data;
      ctx.set('Content-Type', file.type);
    }
  }

  async update() {
    const { ctx } = this;
    const { File } = ctx.model;
    const { params } = ctx;
    await ctx.verify('schema.file', params);

    const file = await File.findById(params.id);
    ctx.assert(file, 404, '文件不存在');
    const result = await ctx.service.fs.update(file.fid);
    Object.assign(file, result.data);
    const updatedFile = await file.save();
    ctx.body = updatedFile;
  }

  async delete() {
    const { ctx } = this;
    const { File } = ctx.model;
    const { params } = ctx;
    await ctx.verify('schema.file', params);

    const file = await File.findById(params.id);
    ctx.assert(file, 404, '文件不存在');
    await ctx.service.fs.delete(file.fid);
    await file.remove();
    ctx.body = file;
  }

  async token() {
    const { ctx } = this;

    ctx.body = { csrf: ctx.csrf };
  }
}

module.exports = FileController;
