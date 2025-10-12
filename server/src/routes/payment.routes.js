const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const paymentController = require('../controllers/payment.controller');

// MoMo payment routes
router.post('/momo/create', auth, requireRole('customer'), paymentController.createMoMoPayment);
router.post('/momo/ipn', paymentController.handleMoMoIPN);
router.get('/momo/:orderId/status', auth, paymentController.getPaymentStatus);
router.post('/momo/refund', auth, requireRole('admin'), paymentController.createRefund);

// General payment routes
router.get('/methods', paymentController.getPaymentMethods);
router.get('/history', auth, requireRole('customer'), paymentController.getPaymentHistory);

module.exports = router;

