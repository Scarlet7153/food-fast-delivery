const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const orderController = require('../controllers/order.controller');

// Customer routes
router.post('/', auth, requireRole('customer'), validate(schemas.order), orderController.createOrder);
router.get('/my-orders', auth, requireRole('customer'), orderController.getMyOrders);
router.get('/:id', auth, orderController.getOrder);
router.patch('/:id/cancel', auth, requireRole('customer'), orderController.cancelOrder);
router.post('/:id/rate', auth, requireRole('customer'), orderController.rateOrder);

// Restaurant routes
router.get('/restaurant/orders', auth, requireRole('restaurant'), orderController.getRestaurantOrders);
router.patch('/:id/status', auth, requireRole('restaurant'), orderController.updateOrderStatus);
router.get('/restaurant/stats', auth, requireRole('restaurant'), orderController.getRestaurantOrderStats);

// Admin routes
router.get('/admin/all', auth, requireRole('admin'), orderController.getAllOrders);

module.exports = router;

