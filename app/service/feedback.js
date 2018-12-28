'use strict';

/*
* @Author: admin
* @Date:   2018-10-17 11:05:25
* @Last Modified by:   zhanglin
* @Last Modified time: 2018-10-22 16:34:51
*/
const Service = require('../lib/DBService');

class FeedbackService extends Service {
  constructor(ctx) {
    super(ctx, 'Feedback');
  }

  async counter() {
    const data = await this.ctx.model.Counter.findOneAndUpdate({_id: 'feedback'}, {$inc: {seq: 1}})

    if (!data) {
      await this.ctx.model.Counter.create({_id: 'feedback', created_at: new Date()})
      return 1
    } 
      return data.seq + 1
    
  }
}

module.exports = FeedbackService;
