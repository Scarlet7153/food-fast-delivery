const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(auth, requireRole('admin'));

// Dashboard and overview
router.get('/dashboard', adminController.getDashboard);
router.get('/overview', adminController.getOverview);
router.get('/analytics', adminController.getAnalytics);
router.get('/system', adminController.getSystemStats);

// User management
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.patch('/users/:id/status', userController.updateUserStatus);

module.exports = router;
