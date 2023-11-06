module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/flights/search',
      handler: 'flight.search',
    },
    {
      method: 'POST',
      path: '/flights/:flightId',
      handler: 'flight.findFlightById',
    },
  ],
};
