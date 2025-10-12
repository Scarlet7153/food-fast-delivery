const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { calculateDistance, calculateDeliveryFee } = require('../utils/geo');
const logger = require('../utils/logger');

// Create order
const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;

    // Validate restaurant exists and is active
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      active: true,
      approved: true
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or not available'
      });
    }

    // Validate menu items
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findOne({
        _id: item.menuItemId,
        restaurantId: restaurantId,
        available: true
      });

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          error: `Menu item ${item.menuItemId} not found or unavailable`
        });
      }

      // Check stock if inventory tracking is enabled
      if (menuItem.inventory.trackInventory && menuItem.inventory.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.inventory.stockQuantity}`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions
      });
    }

    // Calculate delivery fee
    const distance = calculateDistance(
      restaurant.location.coordinates[1], // restaurant lat
      restaurant.location.coordinates[0], // restaurant lng
      deliveryAddress.location.coordinates[1], // delivery lat
      deliveryAddress.location.coordinates[0]  // delivery lng
    );

    const deliveryFee = restaurant.calculateDeliveryFee(distance);
    if (deliveryFee === null) {
      return res.status(400).json({
        success: false,
        error: 'Delivery location is too far from restaurant'
      });
    }

    const total = subtotal + deliveryFee;

    // Create order
    const order = new Order({
      userId: req.user._id,
      restaurantId: restaurantId,
      items: validatedItems,
      amount: {
        subtotal,
        deliveryFee,
        tax: 0, // No tax for now
        discount: 0, // No discount for now
        total,
        currency: 'VND'
      },
      deliveryAddress,
      status: 'PLACED',
      timeline: [{
        status: 'PLACED',
        timestamp: new Date(),
        note: 'Order placed by customer'
      }]
    });

    await order.save();

    // Update menu item popularity
    for (const item of validatedItems) {
      await MenuItem.findByIdAndUpdate(item.menuItemId, {
        $inc: { 'popularity.orderCount': item.quantity }
      });
    }

    // Reserve stock if inventory tracking is enabled
    for (const item of validatedItems) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem.inventory.trackInventory) {
        await menuItem.reserveStock(item.quantity);
      }
    }

    logger.info(`Order created: ${order.orderNumber} by user ${req.user.email}`);

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

// Get my orders (customer)
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const options = {};
    if (status) options.status = status;

    const orders = await Order.findByUser(req.user._id, options)
      .populate('restaurantId', 'name imageUrl rating')
      .populate('missionId', 'status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments({ userId: req.user._id, ...options });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'name phone email')
      .populate('restaurantId', 'name address phone rating')
      .populate('missionId', 'status path timeline')
      .populate('missionId.droneId', 'name serial status location');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'customer' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (req.user.role === 'restaurant' && order.restaurantId._id.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
};

// Cancel order (customer)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel delivered or already cancelled order'
      });
    }

    // Calculate refund amount
    let refundAmount = 0;
    if (order.payment.status === 'PAID') {
      refundAmount = order.amount.total;
    }

    await order.cancelOrder(reason || 'Cancelled by customer', req.user._id, refundAmount);

    // Release reserved stock
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem && menuItem.inventory.trackInventory) {
        await menuItem.updateStock(item.quantity); // Add back to stock
      }
    }

    logger.info(`Order cancelled: ${order.orderNumber} by user ${req.user.email}`);

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
      error: 'Failed to cancel order'
    });
  }
};

// Rate order (customer)
const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { food, delivery, overall, comment } = req.body;

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id,
      status: 'DELIVERED'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not delivered'
      });
    }

    if (order.rating && order.rating.ratedAt) {
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

    // Update restaurant rating
    const restaurant = await Restaurant.findById(order.restaurantId);
    await restaurant.updateRating(overall);

    // Update menu item ratings
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem) {
        await menuItem.updateRating(food);
      }
    }

    logger.info(`Order rated: ${order.orderNumber} - ${overall} stars by user ${req.user.email}`);

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

// Get restaurant orders
const getRestaurantOrders = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view orders'
      });
    }

    const options = {};
    if (status) options.status = status;

    const orders = await Order.findByRestaurant(req.user.restaurantId, {
      ...options,
      dateFrom,
      dateTo
    })
      .populate('userId', 'name phone email')
      .populate('missionId', 'status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments({ 
      restaurantId: req.user.restaurantId, 
      ...options 
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get restaurant orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant orders'
    });
  }
};

// Update order status (restaurant)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update orders'
      });
    }

    const order = await Order.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    await order.updateStatus(status, req.user._id, note);

    // If order is delivered, update restaurant stats
    if (status === 'DELIVERED') {
      await Restaurant.findByIdAndUpdate(req.user.restaurantId, {
        $inc: {
          'stats.totalOrders': 1,
          'stats.completedOrders': 1,
          'stats.totalRevenue': order.amount.total
        }
      });

      // Update average order value
      const restaurant = await Restaurant.findById(req.user.restaurantId);
      restaurant.stats.averageOrderValue = restaurant.stats.totalRevenue / restaurant.stats.totalOrders;
      await restaurant.save();
    }

    logger.info(`Order status updated: ${order.orderNumber} - ${status} by restaurant ${req.user.email}`);

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

// Get restaurant order statistics
const getRestaurantOrderStats = async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view statistics'
      });
    }

    const { dateFrom, dateTo } = req.query;

    const stats = await Order.getStatistics(req.user.restaurantId, dateFrom, dateTo);

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: { restaurantId: req.user.restaurantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.findByRestaurant(req.user.restaurantId, { limit: 5 })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          completionRate: 0
        },
        statusBreakdown,
        recentOrders
      }
    });

  } catch (error) {
    logger.error('Get restaurant order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order statistics'
    });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      restaurantId, 
      userId,
      dateFrom, 
      dateTo,
      search 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (restaurantId) query.restaurantId = restaurantId;
    if (userId) query.userId = userId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Search by order number
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('restaurantId', 'name address')
      .populate('missionId', 'status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  rateOrder,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantOrderStats,
  getAllOrders
};

