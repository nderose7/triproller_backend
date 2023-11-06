module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/amadeus/search-flights',
      handler: 'amadeus.searchFlights',
    },
    {
      method: 'POST',
      path: '/amadeus/search-hotels',
      handler: 'amadeus.searchHotels',
    },
    {
      method: 'POST',
      path: '/amadeus/search-hotel-offers',
      handler: 'amadeus.searchHotelOffers',
    },
    {
      method: 'POST',
      path: '/amadeus/search-pois',
      handler: 'amadeus.searchPointsOfInterest',
    },
  ],
};
