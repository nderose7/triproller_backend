'use strict';

/**
 * airline controller
 */

const RedisCache = require('../../../lib/redisCache');
const cache = new RedisCache(60000000); // Cache results for a long time

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::airline.airline', ({ strapi }) => ({
  // Example of an overridden find method with caching
  async find(ctx) {
    const { query } = ctx;

    // Use a consistent key for the cache based on the query parameters
    const cacheKey = `airlines_${JSON.stringify(query)}`;

    // Try to get the cached result
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      // If cache hit, parse the cached result and return
      return JSON.parse(cachedResult);
    }

    // If cache miss, call the original find method
    const { data, meta } = await super.find(ctx);

    // Cache the result. You can set an expiration time (in seconds) with 'EX'
    await cache.set(cacheKey, JSON.stringify({ data, meta }), 'EX', 3600); // Cache for 1 hour

    // Return the result
    return { data, meta };
  },

  // You can override other methods similarly if needed.
}));
