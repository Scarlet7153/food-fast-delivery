const express = require('express');
const router = express.Router();
const { auth, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const restaurantController = require('../controllers/restaurant.controller');

// Public routes
router.get('/', restaurantController.getRestaurants);
router.get('/:id', restaurantController.getRestaurant);
router.get('/:id/menu', restaurantController.getRestaurantMenu);

// Restaurant owner routes (protected)
router.post('/', auth, requireRole('restaurant'), validate(schemas.restaurant), restaurantController.createRestaurant);
router.put('/:id', auth, requireRole('restaurant'), restaurantController.updateRestaurant);
router.get('/:id/stats', auth, requireRole('restaurant'), restaurantController.getRestaurantStats);

// Admin routes
router.get('/admin/pending', auth, requireRole('admin'), restaurantController.getPendingRestaurants);
router.patch('/admin/:id/approve', auth, requireRole('admin'), restaurantController.approveRestaurant);
router.patch('/admin/:id/reject', auth, requireRole('admin'), restaurantController.rejectRestaurant);

module.exports = router;

