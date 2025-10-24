const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const orderController = require('../controllers/order.controller');

// Protected routes
router.post('/', auth, validate(schemas.createOrder), orderController.createOrder);
router.get('/user', auth, orderController.getUserOrders);
router.get('/:id', auth, orderController.getOrderById);
router.patch('/:id/status', auth, validate(schemas.updateOrderStatus), orderController.updateOrderStatus);
router.patch('/:id/cancel', auth, validate(schemas.cancelOrder), orderController.cancelOrder);
router.post('/:id/rate', auth, validate(schemas.rateOrder), orderController.rateOrder);

// Restaurant routes
router.get('/restaurant/orders', auth, requireRole('restaurant'), orderController.getRestaurantOrders);
router.get('/restaurant/stats', auth, requireRole('restaurant'), orderController.getOrderStatistics);

module.exports = router;
