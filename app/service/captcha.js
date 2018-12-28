'use strict';

const { Service } = require('egg');
const BMP24 = require('gd-bmp').BMP24;
const svgCaptcha = require('svg-captcha');

class CaptchaService extends Service {
  async bmpCaptcha() {
    const { app, ctx } = this;
    // 随机函数
    function rand(min, max) {
      return Math.random() * (max - min + 1) + min | 0; // 特殊的技巧，|0可以强制转换为整数
    }

    function randColor(min, max) {
      const high = Math.random() * (max - min + 1) + min | 0;
      const mid = Math.random() * (max - min + 1) + min | 0;
      const low = Math.random() * (max - min + 1) + min | 0;

      return high * (256 * 256) + mid * 256 + low;
    }

    const img = new BMP24(100, 40);
    img.fillRect(0, 0, img.w, img.h, 0xffffff);
    // 边框
    // img.drawRect(0, 0, img.w-1, img.h-1, rand(0, 0xffffff));

    img.fillRect(rand(0, 100), rand(0, 40), rand(10, 35), rand(10, 35), randColor(0x99, 0xff));

    for (let i = 0; i < 100; i++) {
      img.drawPoint(rand(0, 100), rand(0, 40), randColor(0x33, 0xff));
    }

    const p = app.config.captcha.range;
    let str = '';
    for (let i = 0; i < app.config.captcha.length; i++) {
      str += p.charAt(Math.random() * p.length | 0);
    }

    await app.redis.set(
      `${app.redisPrefix.CAPTCHA}-${ctx.auth.sid}`,
      str,
      'EX',
      app.config.captcha.expire
    );
    img.captchaCode = str;

    const maxParts = [ 20, 40, 60, 80, 100 ];
    const yParts = [ 8, 8, 4 ];

    const fonts = [ BMP24.font8x16, BMP24.font12x24, BMP24.font16x32 ];
    let x = 1;
    let y = 8;
    for (let i = 0; i < str.length; i++) {
      const findex = rand(1, 2);// Math.random() * fonts.length |0;
      const f = fonts[findex];
      const yPart = yParts[findex];
      y = 8 + rand(-yPart, yPart);
      const maxPart = maxParts[i];
      x = x + rand(2, maxPart - f.w - x);

      img.drawChar(str[i], x, y, f, randColor(0x33, 0x99));
      x += f.w;
    }

    img.drawCircle(rand(0, 100), rand(0, 40), rand(10, 40), randColor(0, 0xff));
    img.drawLine(rand(0, 100), rand(0, 40), rand(0, 100), rand(0, 40), randColor(0, 0xff));

    // 画曲线
    const w = img.w / 2;
    const h = img.h;
    const color = randColor(0x33, 0x99);
    const y1 = rand(-5, 5); // Y轴位置调整
    const w2 = rand(10, 15); // 数值越小频率越高
    const h3 = rand(4, 6); // 数值越小幅度越大
    const bl = rand(1, 3);
    for (let i = -w; i < w; i += 0.1) {
      const y = Math.floor(h / h3 * Math.sin(i / w2) + h / 2 + y1);
      const x = Math.floor(i + w);
      for (let j = 0; j < bl; j++) {
        img.drawPoint(x, y + j, color);
      }
    }

    for (let i = 0; i < 100; i++) {
      img.drawPoint(rand(0, 100), rand(0, 40), randColor(0x33, 0xff));
    }

    return img;
  }

  svgCaptcha() {
    return svgCaptcha.create({ size: 5 });
  }

  async verify(value) {
    const { ctx, app } = this;
    const { redisPrefix } = app;

    const captcha = await app.redis.get(`${redisPrefix.CAPTCHA}-${ctx.auth.sid}`);
    ctx.error(captcha, '图形验证码已过期或不存在');
    await app.redis.del(`${redisPrefix.CAPTCHA}-${ctx.auth.sid}`);
    ctx.error(captcha.toLowerCase() === value.toLowerCase(), '图形验证码错误');
  }
}

module.exports = CaptchaService;
