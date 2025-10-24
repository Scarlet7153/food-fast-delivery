const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const paymentController = require('../controllers/payment.controller');

// Protected routes
router.post('/create', auth, validate(schemas.createPayment), paymentController.createPayment);
router.post('/momo/create', auth, paymentController.createMoMoPayment);
router.get('/user', auth, paymentController.getUserPayments);
router.get('/:id', auth, paymentController.getPaymentById);
router.get('/:id/status', auth, paymentController.checkPaymentStatus);
router.post('/refund', auth, validate(schemas.processRefund), paymentController.processRefund);

// Restaurant routes
router.get('/restaurant/payments', auth, requireRole('restaurant'), paymentController.getRestaurantPayments);
router.get('/restaurant/statistics', auth, requireRole('restaurant'), paymentController.getPaymentStatistics);

// MoMo callback routes (no auth required)
router.post('/momo/notify', validate(schemas.processPaymentCallback), paymentController.processPaymentCallback);
router.post('/momo/ipn', validate(schemas.processPaymentCallback), paymentController.processPaymentCallback);

module.exports = router;
