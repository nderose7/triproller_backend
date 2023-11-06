'use strict';

/**
 * itinerary router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::itinerary.itinerary', {
  config: {
    find: {
      policies: ['global::is-owner'],
    },
    findOne: {
      policies: ['global::is-owner'],
    },
    create: {
      middlewares: ['global::assign-owner'],
    },
    update: {
      policies: ['global::is-owner']
    },
    delete: {
      policies: ['global::is-owner']
    }
  }
});
