'use strict';

/**
 * A set of functions called "actions" for `flight`
 */

const axios = require('axios');
const RedisCache = require('../../../lib/redisCache');
const cache = new RedisCache(600); // Cache results for 1 hour

const callKiwi = async (departureAirport, destinationAirport, travelDates, currency = 'USD', maxConnections, airlines, selectedCabins = 'M') => {
  const apiKey = process.env.KIWI_API_KEY; 
  const url = `https://api.tequila.kiwi.com/v2/search?fly_from=${departureAirport}&fly_to=${destinationAirport}&date_from=${travelDates.startDate}&date_to=${travelDates.startDate}&return_from=${travelDates.endDate}&return_to=${travelDates.endDate}&curr=${currency}&selected_cabins=${selectedCabins}`;


  try {
    console.log("Trying kiwi url...")
    const response = await axios.get(url, {
      headers: {
        'apikey': apiKey,
      },
    });
    let data = response.data;

    // Add connections property to each flight
    data.data.forEach(flight => {
      flight.connections = flight.route.length - 1;
    });

    // Filter by connection amount
    if (maxConnections !== undefined) {
      data = data.filter(flight => flight.route.length - 1 <= maxConnections);
    }

    // Filter by airline
    if (airlines !== undefined && airlines.length > 0) {
      data = data.filter(flight => airlines.some(airline => flight.airlines.includes(airline)));
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch data from Kiwi\'s API:', error);
    throw new Error('Failed to fetch data from Kiwi\'s API');
  }
};

module.exports = {
  search: async (ctx) => {
    const { departureAirport, destinationAirport, travelDates, selectedCabins, currency = 'USD', maxConnections, airlines } = ctx.request.body;

    // Create a cache key based on the request parameters
    const cacheKey = `search:${departureAirport}:${destinationAirport}:${JSON.stringify(travelDates)}:${selectedCabins}:${currency}:${maxConnections}:${JSON.stringify(airlines)}`;

    // Check the cache for a previous response
    const cachedResponse = await cache.get(cacheKey, async () => {
      return callKiwi(departureAirport, destinationAirport, travelDates, currency, maxConnections, airlines, selectedCabins);
    });

    if (cachedResponse) {
      // If a cached response is found, return it
      ctx.body = cachedResponse;
    } else {
      // Otherwise, call the Kiwi API
      const response = await callKiwi(departureAirport, destinationAirport, travelDates, currency, maxConnections, airlines, selectedCabins);

      // Cache the response
      await cache.set(cacheKey, response);

      // Return the response
      ctx.body = response;
    }
  },
  findFlightById: async (ctx) => {
    try {
      console.log("Trying to get ctx")
      const flightId = ctx.params.flightId;
      const { departureAirport, destinationAirport, travelDates, currency = 'USD' } = ctx.request.body;

      console.log("Currency:" + currency)

      console.log(departureAirport + destinationAirport + travelDates)
      console.log(flightId)

      // Validate required parameters
      if (!departureAirport || !destinationAirport || !travelDates.startDate || !travelDates.endDate) {
        ctx.throw(400, 'Missing required parameters');
      }

      // Replace with your Kiwi API key
      const kiwiApiKey = process.env.KIWI_API_KEY;

      const cacheKey = `flight:${flightId}`;
      console.log("Doing result...")
      const result = await cache.get(cacheKey, async () => {
        const url = `https://api.tequila.kiwi.com/v2/search?fly_from=${departureAirport}&fly_to=${destinationAirport}&date_from=${travelDates.startDate}&date_to=${travelDates.endDate}&return_from=${travelDates.startDate}&return_to=${travelDates.endDate}&curr=${currency}`;

        const response = await axios.get(url, {
          headers: {
            apikey: kiwiApiKey,
          },
        });

        const flight = response.data.data.find(f => f.id === flightId);

        if (!flight) {
          ctx.throw(404, 'Flight not found');
        }

        return flight;
      });
      console.log(result)
      ctx.body = result;
      
    } catch (error) {
      console.error('Error fetching flight:', error);
      ctx.throw(500, 'Internal Server Error');
    }
  }


};