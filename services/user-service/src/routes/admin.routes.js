const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

// Admin routes
router.get('/users', auth, requireRole('admin'), userController.getAllUsers);
router.patch('/users/:id/status', auth, requireRole('admin'), userController.updateUserStatus);

module.exports = router;
