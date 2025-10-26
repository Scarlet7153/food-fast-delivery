const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const orderController = require('../controllers/order.controller');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(auth, requireRole('admin'));

// Order management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', orderController.getOrderById);
router.patch('/orders/:id/status', orderController.updateOrderStatus);
router.post('/orders/:orderId/assign-drone', adminController.assignDroneToOrder);

// Statistics endpoints
router.get('/statistics', adminController.getStatistics);
router.get('/overview', adminController.getOverview);

module.exports = router;
