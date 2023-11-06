// path: ./src/services/amadeus.js

const axios = require('axios');
const RedisCache = require('../../../lib/redisCache');
// Define a default TTL for cache in seconds
const defaultTTL = 3600; // Example: 3600 seconds = 1 hour
const cache = new RedisCache(defaultTTL); 
// Define cache durations in seconds
const cacheDurations = {
  flights: 6000000000,
  hotels: 6000000000, 
  hotelOffers: 6000000000, 
  pointsOfInterest: 6000000000,
};

const API_ENDPOINT = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const API_KEY = process.env.AMADEUS_API_KEY;
const API_SECRET = process.env.AMADEUS_API_SECRET;



module.exports = {

  getAccessToken: async () => {
    console.log("Attempting getAccessToken...")
    const response = await axios.post(
      API_ENDPOINT,
      `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    //console.log("Response: ", response)
    return response.data.access_token;
  },
  

  searchFlights: async (ctx) => {
    const { originDestinations, travelOptions, preferredCabin, currencyCode = 'USD' } = ctx.request.body;
    console.log(originDestinations);
    const accessToken = await module.exports.getAccessToken();

    const flightCacheDuration = cacheDurations.flights; 

    const cacheKey = JSON.stringify({
      originLocationCode: originDestinations[0].departureAirport,
      destinationLocationCode: originDestinations[0].destinationAirport,
      departureDate: originDestinations[0].startDate,
      preferredCabin: preferredCabin,
    });

    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response');
      return cachedResponse;
    }

    const data = {
      currencyCode: currencyCode,
      originDestinations: [
        {
          id: "1",
          originLocationCode: originDestinations[0].departureAirport,
          destinationLocationCode: originDestinations[0].destinationAirport,
          departureDateTimeRange: {
            date: originDestinations[0].startDate,
          },
        },
      ],
      travelers: [
        {
          id: "1",
          travelerType: "ADULT",
        },
      ],
      sources: ["GDS"],
      searchCriteria: {
        maxFlightOffers: 250,
      },
    };

    // Conditionally add cabinRestrictions to searchCriteria
    if (preferredCabin !== "ANY") {
      data.searchCriteria.flightFilters = {
        cabinRestrictions: [
          {
            cabin: preferredCabin,
            coverage: "MOST_SEGMENTS",
            originDestinationIds: ["1"],
          },
        ],
      };
    }

    try {
      const response = await axios.post(
        'https://test.api.amadeus.com/v2/shopping/flight-offers',
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await cache.set(cacheKey, response.data, flightCacheDuration);

      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error data:", JSON.stringify(error.response.data, null, 2));
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }
      console.error("Error config:", error.config);
      throw error; // You may throw the error again if you want to handle it later
    }

  },

  // The modified searchHotels function with manual pagination
  searchHotels: async (ctx) => {
    console.log("Searching hotel list...")
    const { cityCode, page = 1, limit = 10 } = ctx.request.body; // include a limit in your request
    const cacheKey = `hotels_${cityCode}_${page}_${limit}`; // Cache based on cityCode, page, and limit
    const hotelCacheDuration = cacheDurations.hotels;

    let cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached hotels data for page:', page);
      return cachedData; // Returns only the cached page
    }

    const accessToken = await module.exports.getAccessToken();
    

    // Fetch the complete hotel data if not already cached
    const fullListCacheKey = `hotels_${cityCode}_full_list`;
    let fullList = await cache.get(fullListCacheKey);

    if (!fullList) {
      console.log("City Code: ", cityCode)
      // Make the request to the API as before without pagination parameters
      try {
        const response = await axios.get(
          'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            params: {
              cityCode: cityCode,
            }
          }
        );
        //console.log("Response: ", response.data)
        // Save to cache before returning
        fullList = response.data; // The complete list from the API
        //console.log("Full List:", fullList)
        await cache.set(fullListCacheKey, fullList, hotelCacheDuration); 
      } catch (error) {
        // Check and log the whole error if response is not defined
        if (!error.response) {
          console.error('An error occurred without an HTTP response:', error.message);
          return;
        }
        // Otherwise, safely log the response data or the entire response for debugging
        console.error(JSON.stringify(error.response.data || error.response, null, 2));
        // Re-throw the error for further handling or logging if necessary
        throw error;
      }


    }
    //console.log("Full List:", fullList)
    function paginate(data, page, limit) {
      return data.slice((page - 1) * limit, page * limit);
    }

    // Paginate the full list manually
    const paginatedData = paginate(fullList.data, page, limit);
    await cache.set(cacheKey, paginatedData, hotelCacheDuration); // Cache the paginated data

    return paginatedData; // Return the paginated data
  },



  searchHotelOffers: async (ctx) => {
    console.log("Searching hotel offers...")
    const { hotelIds, checkInDate, checkOutDate } = ctx.request.body;
    console.log("Hotel IDs: ", hotelIds.join(','))
    
    const cacheKey = `hotel_offers_${hotelIds.join('_')}_${checkInDate}_${checkOutDate}`;
    console.log("Cache key: ", cacheKey)
    
    const offerCacheDuration = cacheDurations.hotelOffers;

    // Try to get cached data
    let cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached hotel offers: ', cachedData.data);
      return cachedData;
    }

    const accessToken = await module.exports.getAccessToken();

    try {
      const response = await axios.get(
        `https://test.api.amadeus.com/v3/shopping/hotel-offers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            hotelIds: hotelIds.join(','),
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
          },
        }
      );

      // Save to cache before returning
      await cache.set(cacheKey, response.data, offerCacheDuration);
      return response.data;
    } catch (error) {
      console.error(JSON.stringify(error.response.data, null, 2));
      throw error;
    }
  },



  searchPointsOfInterest: async (ctx) => {
    const { destinationAirport } = ctx.request.body;
    const accessToken = await module.exports.getAccessToken();

    // Cache key based on destinationAirport for the city lookup
    let cacheKey = `city_${destinationAirport}`;
    let cityResponse = await cache.get(cacheKey);

    const poiCacheDuration = cacheDurations.pointsOfInterest; 

    if (!cityResponse) {
      // Get city information to fetch latitude and longitude
      try {
        cityResponse = await axios.get(
          'https://test.api.amadeus.com/v1/reference-data/locations/cities',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              keyword: destinationAirport,
              subType: 'CITY,AIRPORT', // Search for both city and airport codes
            },
          }
        );
        // Store city response in cache
        await cache.set(cacheKey, cityResponse.data);
      } catch (error) {
        console.error(`Error fetching city data: ${JSON.stringify(error.response.data, null, 2)}`);
        throw error;
      }
    }

    // Assuming cityResponse contains latitude and longitude data,
    // and that Amadeus responds with an array where the first item is the desired city
    const { latitude, longitude } = cityResponse.data[0].geoCode;

    // Now fetch points of interest with the obtained latitude and longitude
    cacheKey = `pois_${latitude}_${longitude}`; // Cache key for points of interest
    let poisResponse = await cache.get(cacheKey);

    if (!poisResponse) {
      try {
        poisResponse = await axios.get(
          'https://test.api.amadeus.com/v1/reference-data/locations/pois',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              latitude: latitude,
              longitude: longitude,
            },
          }
        );
        // Store points of interest response in cache
        await cache.set(cacheKey, poisResponse.data, poiCacheDuration);
      } catch (error) {
        console.error(`Error fetching points of interest: ${JSON.stringify(error.response.data, null, 2)}`);
        throw error;
      }
    }

    return poisResponse.data;
  },


};
