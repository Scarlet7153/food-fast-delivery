const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const notificationController = require('../controllers/notification.controller');

// Protected routes
router.get('/', auth, notificationController.getUserNotifications);
router.get('/statistics', auth, notificationController.getNotificationStatistics);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);

// Send notification routes (internal service calls)
router.post('/send', validate(schemas.sendNotification), notificationController.sendNotification);
router.post('/order-status', validate(schemas.sendOrderStatusNotification), notificationController.sendOrderStatusNotification);
router.post('/payment', validate(schemas.sendPaymentNotification), notificationController.sendPaymentNotification);

module.exports = router;
