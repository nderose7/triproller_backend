module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/restaurants/search',
      handler: 'yelp.fetchRestaurants',
    }
  ],
};
