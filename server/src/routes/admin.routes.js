const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(auth, requireRole('admin'));

// Dashboard and overview
router.get('/dashboard', adminController.getDashboard);
router.get('/overview', adminController.getOverview);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Restaurant management
router.get('/restaurants', adminController.getAllRestaurants);
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.get('/restaurants/:id', adminController.getRestaurant);
router.patch('/restaurants/:id/approve', adminController.approveRestaurant);
router.patch('/restaurants/:id/reject', adminController.rejectRestaurant);
router.patch('/restaurants/:id/status', adminController.updateRestaurantStatus);

// Order management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/statistics', adminController.getOrderStatistics);

// Drone monitoring
router.get('/drones', adminController.getAllDrones);
router.get('/drones/statistics', adminController.getDroneStatistics);

// Mission monitoring
router.get('/missions', adminController.getAllMissions);
router.get('/missions/statistics', adminController.getMissionStatistics);

// System statistics
router.get('/statistics', adminController.getSystemStatistics);

module.exports = router;
