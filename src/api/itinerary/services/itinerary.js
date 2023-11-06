'use strict';

/**
 * itinerary service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::itinerary.itinerary');
