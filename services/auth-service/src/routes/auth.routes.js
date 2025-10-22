const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const authController = require('../controllers/auth.controller');

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/refresh', validate(schemas.refreshToken), authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.post('/logout-all', auth, authController.logoutAll);
router.post('/forgot-password', validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), authController.resetPassword);

// Protected routes
router.get('/me', auth, authController.getProfile);

// Token verification (for API Gateway)
router.get('/verify', authController.verifyToken);

module.exports = router;
