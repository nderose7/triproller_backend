'use strict';

/**
 *  itinerary controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::itinerary.itinerary',
({
  strapi
}) => ({
  async find(ctx) {
    const { filters } = ctx.query
    ctx.query = {
      ...ctx.query,
      filters: {
        ...filters,
        owner: {
          id: ctx.state.user.id
        }
      }
    }
    return await super.find(ctx);
  },
  
  async update(ctx){
    ctx.query.filters = {
        ...(ctx.query.filters || {}),
        owner: ctx.state.user.id
    };

    return await super.update(ctx);
  },
  async delete(ctx){
    ctx.query.filters = {
        ...(ctx.query.filters || {}),
        owner: ctx.state.user.id
    };

    return await super.delete(ctx);
  },
  
  async create(ctx) {
    console.log('Creating Itinerary!')
    return await super.create(ctx);
  }
}));