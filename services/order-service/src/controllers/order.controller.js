const Order = require('../models/Order');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Create order
const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user._id
    };

    // Validate restaurant exists and is active
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${orderData.restaurantId}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (!restaurant.active || !restaurant.approved) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant is not available for orders'
        });
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Calculate estimated delivery time
    const order = new Order(orderData);
    order.calculateEstimatedDeliveryTime();
    await order.save();

    // Create payment request if needed
    if (order.payment.method === 'MOMO') {
      try {
        const paymentResponse = await axios.post(`${config.PAYMENT_SERVICE_URL}/api/payments/momo/create`, {
          orderId: order._id,
          amount: order.amount.total,
          orderInfo: `Order ${order.orderNumber}`,
          extraData: JSON.stringify({
            orderNumber: order.orderNumber,
            restaurantId: order.restaurantId
          })
        });

        if (paymentResponse.data.success) {
          order.payment.momo = paymentResponse.data.data;
          order.payment.status = 'PENDING';
          await order.save();
        }
      } catch (error) {
        logger.error('Payment creation failed:', error);
        // Continue with order creation even if payment fails
      }
    }

    logger.info(`New order created: ${order.orderNumber} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const options = {};
    if (status) options.status = status;
    
    const orders = await Order.findByUser(req.user._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments({ userId: req.user._id, ...options });
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user has permission to view this order
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'restaurant') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this order'
      });
    }
    
    res.json({
      success: true,
      data: {
        order
      }
    });
    
  } catch (error) {
    logger.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this order'
      });
    }
    
    if (req.user.role === 'restaurant') {
      // Restaurant can only update orders from their restaurant
      try {
        const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
        const restaurant = restaurantResponse.data.data.restaurant;
        
        if (order.restaurantId.toString() !== restaurant._id.toString()) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to update this order'
          });
        }
      } catch (error) {
        return res.status(403).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
    }
    
    await order.updateStatus(status, req.user._id, note);
    
    // Notify relevant services
    try {
      await axios.post(`${config.NOTIFICATION_SERVICE_URL}/api/notifications/order-status`, {
        orderId: order._id,
        userId: order.userId,
        status,
        orderNumber: order.orderNumber
      });
    } catch (error) {
      logger.warn('Failed to send notification:', error);
    }
    
    logger.info(`Order status updated: ${order.orderNumber} to ${status} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });
    
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check permissions
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this order'
      });
    }
    
    // Calculate refund amount
    let refundAmount = 0;
    if (order.payment.status === 'PAID') {
      refundAmount = order.amount.total;
    }
    
    await order.cancelOrder(reason, req.user._id, refundAmount);
    
    // Process refund if needed
    if (refundAmount > 0) {
      try {
        await axios.post(`${config.PAYMENT_SERVICE_URL}/api/payments/refund`, {
          orderId: order._id,
          amount: refundAmount,
          reason
        });
      } catch (error) {
        logger.error('Refund failed:', error);
      }
    }
    
    // Notify services
    try {
      await axios.post(`${config.NOTIFICATION_SERVICE_URL}/api/notifications/order-cancelled`, {
        orderId: order._id,
        userId: order.userId,
        reason,
        refundAmount
      });
    } catch (error) {
      logger.warn('Failed to send cancellation notification:', error);
    }
    
    logger.info(`Order cancelled: ${order.orderNumber} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });
    
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
};

// Get restaurant orders
const getRestaurantOrders = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    
    // Get restaurant ID for the user
    let restaurantId;
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      restaurantId = restaurantResponse.data.data.restaurant._id;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const options = {};
    if (status) options.status = status;
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;
    
    const orders = await Order.findByRestaurant(restaurantId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments({ restaurantId, ...options });
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Get restaurant ID for the user
    let restaurantId;
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      restaurantId = restaurantResponse.data.data.restaurant._id;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const stats = await Order.getStatistics(restaurantId, dateFrom, dateTo);
    
    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          completionRate: 0
        }
      }
    });
    
  } catch (error) {
    logger.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};

// Rate order
const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { food, delivery, overall, comment } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to rate this order'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        error: 'Can only rate delivered orders'
      });
    }
    
    // Check if already rated
    if (order.rating.ratedAt) {
      return res.status(400).json({
        success: false,
        error: 'Order already rated'
      });
    }
    
    order.rating = {
      food,
      delivery,
      overall,
      comment,
      ratedAt: new Date()
    };
    
    await order.save();
    
    // Update restaurant and menu item ratings
    try {
      await axios.post(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${order.restaurantId}/rating`, {
        rating: overall
      });
    } catch (error) {
      logger.warn('Failed to update restaurant rating:', error);
    }
    
    logger.info(`Order rated: ${order.orderNumber} by user ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Order rated successfully',
      data: {
        order
      }
    });
    
  } catch (error) {
    logger.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate order'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
  getOrderStatistics,
  rateOrder
};
