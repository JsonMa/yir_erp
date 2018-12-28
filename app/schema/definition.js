'use strict';

module.exports = {
  oid: { type: 'string', pattern: '^[a-zA-Z0-9]{24}$' },
  str: { type: 'string', pattern: '^.{1,24}$' },
  text: { type: 'string', pattern: '^.{1,1024}$' },
  mobile: { type: 'string', pattern: '^1[3,4,5,7,8]\\d{9}$' }, // eslint-disable-line
  email: { type: 'string', pattern: '^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$' },
  password: { //  service中做校验 字母 + 数字 + 特殊字符 三选二
    type: 'string',
  },
};
