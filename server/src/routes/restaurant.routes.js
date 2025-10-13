const express = require('express');
const router = express.Router();
const { auth, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const restaurantController = require('../controllers/restaurant.controller');

// Public routes
router.get('/', restaurantController.getRestaurants);

// Restaurant owner routes (protected)
router.get('/me', auth, requireRole('restaurant'), restaurantController.getMyRestaurant);
router.put('/me', auth, requireRole('restaurant'), validate(schemas.restaurantUpdate), restaurantController.updateMyRestaurant);
router.post('/', auth, requireRole('restaurant'), validate(schemas.restaurant), restaurantController.createRestaurant);

// Public routes (must be after /me to avoid conflict)
router.get('/:id', restaurantController.getRestaurant);
router.get('/:id/menu', auth, requireRole('restaurant'), restaurantController.getRestaurantMenu);
router.post('/:id/menu', auth, requireRole('restaurant'), validate(schemas.menuItem), restaurantController.createMenuItem);
router.put('/:id/menu/:itemId', auth, requireRole('restaurant'), validate(schemas.menuItem), restaurantController.updateMenuItem);
router.delete('/:id/menu/:itemId', auth, requireRole('restaurant'), restaurantController.deleteMenuItem);
router.put('/:id', auth, requireRole('restaurant'), restaurantController.updateRestaurant);
router.get('/:id/stats', auth, requireRole('restaurant'), restaurantController.getRestaurantStats);

// Admin routes
router.get('/admin/pending', auth, requireRole('admin'), restaurantController.getPendingRestaurants);
router.patch('/admin/:id/approve', auth, requireRole('admin'), restaurantController.approveRestaurant);
router.patch('/admin/:id/reject', auth, requireRole('admin'), restaurantController.rejectRestaurant);

module.exports = router;