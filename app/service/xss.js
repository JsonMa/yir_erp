'use strict';

const { Service } = require('egg');
const xss = require('xss');

class XssService extends Service {
  constructor(ctx) {
    super(ctx);
    const options = {
      css: false,
      stripIgnoreTag: false, // true-去掉，false-转义
      // stripIgnoreTagBody: ['script', 'svg', 'body', 'frameset', 'iframe'],
      stripBlankChar: true, // 清除不可打印字符
      allowCommentTag: false, // 是否禁止备注标签
      whiteList: {
        a: [ 'style', 'target', 'href', 'title' ],
        b: [ 'style' ],
        br: [ 'style' ],
        font: [ 'style', 'color', 'size', 'face' ],
        h1: [ 'style' ],
        h2: [ 'style' ],
        h3: [ 'style' ],
        h4: [ 'style' ],
        h5: [ 'style' ],
        h6: [ 'style' ],
        i: [ 'style' ],
        img: [ 'style', 'src', 'alt', 'title', 'width', 'height' ],
        li: [ 'style' ],
        ol: [ 'style' ],
        p: [ 'style', 'align' ],
        span: [ 'style' ],
        u: [ 'style' ],
        ul: [ 'style' ],
        blockquote: [ 'style', 'cite' ],
        strike: [ 'style' ],
      },
    };
    this.tagXss = new xss.FilterXSS(options);
  }

  arrayTraverse(array) {
    array.forEach((each, index) => {
      if (each instanceof Array) {
        this.arrayTraverse(each);
      } else if (each instanceof Object) {
        this.mapTraverse(each);
      } else {
        array[index] = this.tagXss.process(each);
      }
    });
  }

  mapTraverse(obj) {
    for (const key in obj) {
      if (obj[key] instanceof Array) {
        this.arrayTraverse(obj[key]);
      } else if (obj[key] instanceof Object) {
        this.mapTraverse(obj[key]);
      } else {
        obj[key] = this.tagXss.process(obj[key]);
      }
    }
  }

  xssFilter(params) {
    if (!params) {
      return {};
    }
    this.mapTraverse(params);
    return params;
  }
}

module.exports = XssService;
