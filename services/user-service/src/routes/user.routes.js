const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const userController = require('../controllers/user.controller');

// ===== AUTH ROUTES (Public) =====

// Authentication routes
router.post('/register', validate(schemas.register), userController.register);
router.post('/login', validate(schemas.login), userController.login);
router.post('/refresh-token', validate(schemas.refreshToken), userController.refreshToken);
router.post('/logout', auth, userController.logout);
router.post('/logout-all', auth, userController.logoutAll);

// Password reset routes
router.post('/forgot-password', validate(schemas.forgotPassword), userController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), userController.resetPassword);

// Token verification (for API Gateway)
router.get('/verify', userController.verifyToken);

// User profile routes (for auth endpoints)
router.get('/me', auth, userController.getProfile);
router.put('/profile', auth, validate(schemas.updateProfile), userController.updateProfile);
router.put('/change-password', auth, validate(schemas.changePassword), userController.changePassword);

// ===== USER MANAGEMENT ROUTES (Protected) =====

// User profile routes
router.get('/me', auth, userController.getProfile);
router.put('/me', auth, validate(schemas.updateProfile), userController.updateProfile);
router.put('/change-password', auth, validate(schemas.changePassword), userController.changePassword);

// ===== ADMIN ROUTES (Admin Only) =====

// User management routes
router.get('/', auth, requireRole('admin'), userController.getAllUsers);
router.get('/:id', auth, requireRole('admin'), userController.getUserById);
router.put('/:id', auth, requireRole('admin'), validate(schemas.updateUser), userController.updateUser);
router.delete('/:id', auth, requireRole('admin'), userController.deleteUser);

// Statistics routes
router.get('/admin/statistics', auth, requireRole('admin'), userController.getUserStatistics);

module.exports = router;