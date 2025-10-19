const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const userController = require('../controllers/user.controller');

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validate(schemas.updateProfile), userController.updateProfile);

// Admin only routes
router.get('/users', auth, requireRole('admin'), userController.getAllUsers);
router.patch('/users/:id/status', auth, requireRole('admin'), validate(schemas.updateUserStatus), userController.updateUserStatus);

// Refresh token management (for Auth Service)
router.post('/:id/refresh-tokens', userController.addRefreshToken);
router.delete('/:id/refresh-tokens', validate(schemas.removeRefreshToken), userController.removeRefreshToken);
router.delete('/:id/refresh-tokens/all', userController.removeAllRefreshTokens);
router.post('/:id/refresh-tokens/validate', validate(schemas.validateRefreshToken), userController.validateRefreshToken);

// Get user by ID (for other services)
router.get('/:id', userController.getUserById);

module.exports = router;
