const Notification = require('../models/Notification');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Send notification
const sendNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, channels, priority = 'NORMAL' } = req.body;
    
    // Validate user exists
    try {
      const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/users/${userId}`);
      const user = userResponse.data.data.user;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const notificationData = {
      userId,
      type,
      title,
      message,
      data: data || {},
      channels: channels || ['IN_APP'],
      priority
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Send notifications through specified channels
    const results = await sendNotificationChannels(notification, channels || ['IN_APP']);
    
    // Update notification status based on results
    let overallStatus = 'PENDING';
    if (results.some(r => r.success)) {
      overallStatus = 'SENT';
    }
    if (results.every(r => r.success)) {
      overallStatus = 'DELIVERED';
    }
    if (results.every(r => !r.success)) {
      overallStatus = 'FAILED';
    }
    
    await notification.updateStatus(overallStatus);
    
    logger.info(`Notification sent: ${notification._id} to user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notification,
        results
      }
    });
    
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
};

// Send order status notification
const sendOrderStatusNotification = async (req, res) => {
  try {
    const { orderId, userId, status, orderNumber, items, total, estimatedDeliveryTime } = req.body;
    
    // Get user details
    let user;
    try {
      const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/users/${userId}`);
      user = userResponse.data.data.user;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const notificationData = {
      userId,
      type: 'ORDER_STATUS_UPDATE',
      title: `Order ${orderNumber}`,
      message: getOrderStatusMessage(status),
      data: {
        orderId,
        orderNumber,
        status,
        items,
        total,
        estimatedDeliveryTime
      },
      channels: ['IN_APP', 'PUSH', 'EMAIL'],
      priority: 'HIGH',
      relatedEntity: {
        type: 'ORDER',
        id: orderId
      }
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Send through different channels
    const results = await sendOrderNotificationChannels(notification, user, {
      orderNumber,
      status,
      items,
      total,
      estimatedDeliveryTime
    });
    
    // Update notification status
    let overallStatus = 'PENDING';
    if (results.some(r => r.success)) {
      overallStatus = 'SENT';
    }
    if (results.every(r => r.success)) {
      overallStatus = 'DELIVERED';
    }
    if (results.every(r => !r.success)) {
      overallStatus = 'FAILED';
    }
    
    await notification.updateStatus(overallStatus);
    
    logger.info(`Order status notification sent: ${notification._id} for order ${orderNumber}`);
    
    res.status(201).json({
      success: true,
      message: 'Order status notification sent successfully',
      data: {
        notification,
        results
      }
    });
    
  } catch (error) {
    logger.error('Send order status notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send order status notification'
    });
  }
};

// Send payment notification
const sendPaymentNotification = async (req, res) => {
  try {
    const { userId, orderId, orderNumber, amount, status, paymentMethod } = req.body;
    
    // Get user details
    let user;
    try {
      const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/users/${userId}`);
      user = userResponse.data.data.user;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const notificationData = {
      userId,
      type: status === 'SUCCESS' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
      title: 'Payment Update',
      message: `Payment for order ${orderNumber} is ${status.toLowerCase()}`,
      data: {
        orderId,
        orderNumber,
        amount,
        status,
        paymentMethod
      },
      channels: ['IN_APP', 'PUSH', 'EMAIL'],
      priority: 'HIGH',
      relatedEntity: {
        type: 'PAYMENT',
        id: orderId
      }
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Send through different channels
    const results = await sendPaymentNotificationChannels(notification, user, {
      orderNumber,
      amount,
      status,
      paymentMethod
    });
    
    // Update notification status
    let overallStatus = 'PENDING';
    if (results.some(r => r.success)) {
      overallStatus = 'SENT';
    }
    if (results.every(r => r.success)) {
      overallStatus = 'DELIVERED';
    }
    if (results.every(r => !r.success)) {
      overallStatus = 'FAILED';
    }
    
    await notification.updateStatus(overallStatus);
    
    logger.info(`Payment notification sent: ${notification._id} for order ${orderNumber}`);
    
    res.status(201).json({
      success: true,
      message: 'Payment notification sent successfully',
      data: {
        notification,
        results
      }
    });
    
  } catch (error) {
    logger.error('Send payment notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send payment notification'
    });
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { type, unreadOnly, page = 1, limit = 20 } = req.query;
    
    const options = {};
    if (type) options.type = type;
    if (unreadOnly === 'true') options.unreadOnly = true;
    
    const notifications = await Notification.findByUser(req.user._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ userId: req.user._id, ...options });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to mark this notification as read'
      });
    }
    
    await notification.markAsRead();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
    
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, status: { $in: ['PENDING', 'SENT', 'DELIVERED'] } },
      { 
        status: 'READ',
        'delivery.inApp.read': true,
        'delivery.inApp.readAt': new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Get notification statistics
const getNotificationStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const stats = await Notification.getStatistics(req.user._id, dateFrom, dateTo);
    
    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalNotifications: 0,
          readNotifications: 0,
          unreadNotifications: 0,
          failedNotifications: 0,
          readRate: 0
        }
      }
    });
    
  } catch (error) {
    logger.error('Get notification statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
};

// Helper function to send notifications through channels
async function sendNotificationChannels(notification, channels) {
  const results = [];
  
  for (const channel of channels) {
    try {
      let result;
      
      switch (channel) {
        case 'IN_APP':
          result = { success: true, channel: 'IN_APP' };
          await notification.markAsSent('inapp');
          break;
          
        case 'PUSH':
          // This would require device token from user profile
          result = { success: true, channel: 'PUSH' };
          await notification.markAsSent('push');
          break;
          
        case 'EMAIL':
          // This would require user email
          result = { success: true, channel: 'EMAIL' };
          await notification.markAsSent('email');
          break;
          
        default:
          result = { success: false, channel, error: 'Unsupported channel' };
      }
      
      results.push(result);
    } catch (error) {
      results.push({ success: false, channel, error: error.message });
      await notification.markAsFailed(channel.toLowerCase(), error.message);
    }
  }
  
  return results;
}

// Helper function to send order notifications
async function sendOrderNotificationChannels(notification, user, orderData) {
  const results = [];
  
  try {
    // In-app notification
    await notification.markAsSent('inapp');
    results.push({ success: true, channel: 'IN_APP' });
    
    // Push notification (if user has device token)
    if (user.deviceToken) {
      try {
        await pushService.sendOrderStatusNotification(user.deviceToken, orderData);
        await notification.markAsSent('push');
        results.push({ success: true, channel: 'PUSH' });
      } catch (error) {
        await notification.markAsFailed('push', error.message);
        results.push({ success: false, channel: 'PUSH', error: error.message });
      }
    }
    
    // Email notification
    if (user.email) {
      try {
        await emailService.sendOrderNotification(user.email, user.name, orderData);
        await notification.markAsSent('email');
        results.push({ success: true, channel: 'EMAIL' });
      } catch (error) {
        await notification.markAsFailed('email', error.message);
        results.push({ success: false, channel: 'EMAIL', error: error.message });
      }
    }
    
  } catch (error) {
    logger.error('Error sending order notification channels:', error);
  }
  
  return results;
}

// Helper function to send payment notifications
async function sendPaymentNotificationChannels(notification, user, paymentData) {
  const results = [];
  
  try {
    // In-app notification
    await notification.markAsSent('inapp');
    results.push({ success: true, channel: 'IN_APP' });
    
    // Push notification (if user has device token)
    if (user.deviceToken) {
      try {
        await pushService.sendPaymentNotification(user.deviceToken, paymentData);
        await notification.markAsSent('push');
        results.push({ success: true, channel: 'PUSH' });
      } catch (error) {
        await notification.markAsFailed('push', error.message);
        results.push({ success: false, channel: 'PUSH', error: error.message });
      }
    }
    
    // Email notification
    if (user.email) {
      try {
        await emailService.sendPaymentNotification(user.email, user.name, paymentData);
        await notification.markAsSent('email');
        results.push({ success: true, channel: 'EMAIL' });
      } catch (error) {
        await notification.markAsFailed('email', error.message);
        results.push({ success: false, channel: 'EMAIL', error: error.message });
      }
    }
    
  } catch (error) {
    logger.error('Error sending payment notification channels:', error);
  }
  
  return results;
}

// Helper function to get order status message
function getOrderStatusMessage(status) {
  const statusMessages = {
    'PLACED': 'Your order has been placed and is being confirmed',
    'CONFIRMED': 'Your order has been confirmed and is being prepared',
    'COOKING': 'Your food is being prepared with love',
    'READY_FOR_PICKUP': 'Your order is ready! Drone is preparing for takeoff',
    'IN_FLIGHT': 'Your drone is on the way! 🚁',
    'DELIVERED': 'Your order has been delivered! Enjoy your meal! 🍕',
    'CANCELLED': 'Your order has been cancelled',
    'FAILED': 'There was an issue with your order'
  };
  
  return statusMessages[status] || 'Your order status has been updated';
}

module.exports = {
  sendNotification,
  sendOrderStatusNotification,
  sendPaymentNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStatistics
};
