const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const restaurantController = require('../controllers/restaurant.controller');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(auth, requireRole('admin'));

// Restaurant management
router.get('/restaurants', restaurantController.getAllRestaurants);
router.get('/restaurants/pending', restaurantController.getPendingRestaurants);
router.get('/restaurants/:id', restaurantController.getRestaurantById);
router.patch('/restaurants/:id/approve', restaurantController.approveRestaurant);
router.patch('/restaurants/:id/reject', restaurantController.rejectRestaurant);
router.patch('/restaurants/:id/status', restaurantController.updateRestaurantStatus);

// Statistics endpoints
router.get('/statistics', adminController.getStatistics);
router.get('/overview', adminController.getOverview);

module.exports = router;
