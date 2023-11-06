'use strict';

/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    console.log('Assigning Owner...')
    if (ctx.request.body.data) {
      console.log(ctx.request.body.data)
    }
    if (!ctx.request.body.data) {
      console.log('No data!')
      ctx.request.body.data = {};
    }
    ctx.request.body.data.owner = ctx.state.user.id;
    console.log("Owner: " + ctx.request.body.data.owner)
    console.log(ctx.request.body.data)
    console.log('Owner Assigned...')
    await next();
  };
};
