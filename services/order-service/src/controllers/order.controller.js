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
    let restaurant;
    let menuItems;
    try {
      console.log('Checking restaurant:', orderData.restaurantId);
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${orderData.restaurantId}`);
      console.log('Restaurant response:', restaurantResponse.data);
      restaurant = restaurantResponse.data.data.restaurant;
      menuItems = restaurantResponse.data.data.menuItems;
      
      if (!restaurant.active || !restaurant.approved) {
        console.log('Restaurant not available:', { active: restaurant.active, approved: restaurant.approved });
        return res.status(400).json({
          success: false,
          error: 'Restaurant is not available for orders'
        });
      }
    } catch (error) {
      console.log('Restaurant validation error:', error.message);
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

      // Add restaurant info to order data
      orderData.restaurant = {
        name: restaurant.name,
        description: restaurant.description,
        imageUrl: restaurant.imageUrl,
        phone: restaurant.phone
      };

      // Add imageUrl to items
      orderData.items = orderData.items.map(item => {
        const menuItem = menuItems.find(mi => mi._id === item.menuItemId);
        return {
          ...item,
          imageUrl: menuItem?.imageUrl || ''
        };
      });

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
        }, {
          headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
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
    } else if (order.payment.method === 'COD') {
      // For COD, mark payment as paid immediately
      order.payment.status = 'PAID';
      order.status = 'PLACED';
      await order.save();
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
    
    console.log('Update order status request:', { id, status, note, user: req.user });
    
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
    
    try {
      await order.updateStatus(status, req.user._id, note);
    } catch (error) {
      console.log('Status update error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
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

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, restaurantId, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (restaurantId) query.restaurantId = restaurantId;
    
    // Don't filter by search in database query
    // We'll filter after enriching with user data
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    // Enrich orders with user information
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      try {
        // Get user information from user-service
        const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/admin/users/${order.userId}`, {
          headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
        });
        
        const user = userResponse.data.data?.user;
        
        // Clean up duplicate timeline entries
        order.cleanupTimeline();
        
        return {
          ...order.toObject(),
          userId: {
            _id: order.userId,
            name: user?.name || 'Không xác định',
            email: user?.email || 'Chưa có thông tin'
          }
        };
      } catch (error) {
        logger.warn(`Failed to fetch user info for order ${order._id}:`, error.message);
        
        // Clean up duplicate timeline entries
        order.cleanupTimeline();
        
        return {
          ...order.toObject(),
          userId: {
            _id: order.userId,
            name: 'Không xác định',
            email: 'Chưa có thông tin'
          }
        };
      }
    }));

    // Filter by search query on frontend (only orderNumber, customer name, phone)
    let filteredOrders = enrichedOrders;
    if (search) {
      console.log('=== Search Debug ===');
      console.log('Search query:', search);
      console.log('Total orders:', enrichedOrders.length);
      
      // Log first order to see structure
      if (enrichedOrders.length > 0) {
        console.log('Sample order data:');
        console.log('- orderNumber:', enrichedOrders[0].orderNumber);
        console.log('- deliveryAddress:', enrichedOrders[0].deliveryAddress);
        console.log('- contactName:', enrichedOrders[0].deliveryAddress?.contactName);
        console.log('- contactPhone:', enrichedOrders[0].deliveryAddress?.contactPhone);
      }
      
      // Function to remove Vietnamese accents for better search
      const removeAccents = (str) => {
        if (!str) return '';
        return str.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'D');
      };

      filteredOrders = enrichedOrders.filter(order => {
        const searchLower = search.toLowerCase();
        const searchNoAccent = removeAccents(searchLower);
        
        // Search only in: orderNumber, contact name (from deliveryAddress), phone
        const searchableFields = [
          order.orderNumber,
          order.deliveryAddress?.contactName,
          order.deliveryAddress?.contactPhone
        ];

        const matches = searchableFields.some(field => {
          if (!field) return false;
          const fieldLower = field.toLowerCase();
          const fieldNoAccent = removeAccents(fieldLower);
          
          return fieldLower.includes(searchLower) || fieldNoAccent.includes(searchNoAccent);
        });
        
        if (matches) {
          console.log('✓ Found match in order:', order.orderNumber);
        }
        
        return matches;
      });
      
      console.log('Filtered orders:', filteredOrders.length);
      console.log('===================');
    }
    
    // Get unique restaurants from all orders (not just current page)
    const allOrders = await Order.find({}).select('restaurantId restaurant');
    const restaurantsMap = new Map();
    
    allOrders.forEach(order => {
      if (order.restaurantId && order.restaurant?.name) {
        restaurantsMap.set(order.restaurantId.toString(), {
          _id: order.restaurantId,
          name: order.restaurant.name
        });
      }
    });
    
    const restaurants = Array.from(restaurantsMap.values());
    
    res.json({
      success: true,
      data: {
        orders: filteredOrders,
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: search ? filteredOrders.length : total,
          pages: Math.ceil((search ? filteredOrders.length : total) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// Assign drone to order (restaurant)
const assignDroneToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order is in correct status
    if (order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({
        success: false,
        error: 'Order must be in READY_FOR_PICKUP status to assign drone'
      });
    }
    
    // Check if order already has a mission
    if (order.missionId) {
      return res.status(400).json({
        success: false,
        error: 'Order already has a delivery mission assigned'
      });
    }
    
    // Verify restaurant ownership
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (order.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to assign drone to this order'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    // Get available drones from drone service
    let availableDrones;
    try {
      const dronesResponse = await axios.get(`${config.DRONE_SERVICE_URL}/api/restaurant/drones`, {
        params: {
          status: 'IDLE'
        },
        headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
      });
      
      availableDrones = dronesResponse.data.data.drones || [];
    } catch (error) {
      logger.error('Failed to get available drones:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get available drones'
      });
    }
    
    if (availableDrones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No available drones found. All drones are busy.'
      });
    }
    
    // Select the first available drone
    const selectedDrone = availableDrones[0];
    
    // Create delivery mission via drone service
    let mission;
    try {
      const missionResponse = await axios.post(
        `${config.DRONE_SERVICE_URL}/api/restaurant/missions`,
        {
          orderId: order._id,
          droneId: selectedDrone._id
        },
        {
          headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
        }
      );
      
      mission = missionResponse.data.data.mission;
    } catch (error) {
      logger.error('Failed to create mission:', error.response?.data || error);
      return res.status(500).json({
        success: false,
        error: error.response?.data?.error || 'Failed to create delivery mission'
      });
    }
    
    // Update order with mission info
    order.missionId = mission._id;
    order.status = 'IN_FLIGHT';
    order.timeline.push({
      status: 'IN_FLIGHT',
      timestamp: new Date(),
      note: `Được giao cho drone ${selectedDrone.name} (${selectedDrone.serialNumber || 'N/A'}) - Mission ${mission.missionNumber}`,
      updatedBy: req.user._id
    });
    
    await order.save();
    
    logger.info(`Drone ${selectedDrone.name} assigned to order ${order.orderNumber} by restaurant ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Drone assigned successfully',
      data: {
        order,
        drone: selectedDrone,
        mission
      }
    });
    
  } catch (error) {
    logger.error('Assign drone to order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign drone to order'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getRestaurantOrders,
  getOrderStatistics,
  assignDroneToOrder
};
