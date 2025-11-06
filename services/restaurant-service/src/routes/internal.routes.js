const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');

// Internal routes for service-to-service communication
// These should NOT be exposed through API Gateway

// Get all restaurants (no auth required, for internal use only)
router.get('/restaurants', restaurantController.getAllRestaurantsInternal);

module.exports = router;
