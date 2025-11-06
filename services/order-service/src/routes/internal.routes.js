const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Internal API routes (for microservices communication)
// No authentication required for internal routes

// Get order by ID (for drone-service to fetch order details)
router.get('/orders/:id', orderController.getOrderByIdInternal);

module.exports = router;
