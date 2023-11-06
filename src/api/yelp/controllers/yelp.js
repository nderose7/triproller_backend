// path: ./src/api/restaurant/controllers/restaurant.js

const axios = require('axios');
const RedisCache = require('../../../lib/redisCache');
const cache = new RedisCache(600000); // Cache results for 10 minutes

const YELP_API_KEY = process.env.YELP_API_KEY; // Set this in your environment variables
const API_ENDPOINT = 'https://api.yelp.com/v3/businesses/search';

module.exports = {
  fetchRestaurants: async (ctx) => { // Make sure to pass in ctx here
    // Destructure variables from the request body with default values for LA
    const {
      term = '',
      location = 'New York, NY',
    } = ctx.request.body;



    // Construct a unique cache key using the provided parameters
    const cacheKey = `yelp_${term}_${location}`;

    try {
      console.log("Trying cache...")
      // Check if the data is in cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached response');
        console.log(cachedData)
        ctx.body = { data: cachedData };
        return;
      }
      console.log("Trying yelp API..." + YELP_API_KEY)
      // Make a request to Yelp API if cache misses
      const response = await axios.get(API_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: { term, location },
      });
      console.log("Yelp API call successful..." + response.data)

      // Cache the Yelp response
      await cache.set(cacheKey, response.data);

      // Send response to the client
      ctx.body = { data: response.data };
    } catch (error) {
      console.error(`Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
      ctx.status = error.response?.status || 500;
      ctx.body = error.response?.data || { message: 'An error occurred during the API request.' };
    }
  },
};

