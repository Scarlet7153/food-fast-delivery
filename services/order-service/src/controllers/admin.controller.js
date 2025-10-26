const Order = require('../models/Order');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Assign drone to order
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
    
    // Get available drones from drone service
    let availableDrones;
    try {
      // Get restaurant owner info to get available drones
      const dronesResponse = await axios.get(`${config.DRONE_SERVICE_URL}/api/admin/drones`, {
        params: {
          status: 'IDLE',
          restaurantId: order.restaurantId
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
        `${config.DRONE_SERVICE_URL}/api/admin/missions`,
        {
          orderId: order._id,
          droneId: selectedDrone._id,
          restaurantId: order.restaurantId
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
    
    logger.info(`Drone ${selectedDrone.name} assigned to order ${order.orderNumber}`);
    
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

// Get order statistics
const getStatistics = async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    // Calculate date range
    let startDate, endDate;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    const [
      totalOrders,
      completedOrders,
      inProgressOrders,
      pendingOrders,
      cancelledOrders,
      newOrders,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate } 
      }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue by time period
    const revenueByPeriod = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgValue: { $avg: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalOrders,
        completed: completedOrders,
        inProgress: inProgressOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        new: newOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: avgOrderValue[0]?.avgValue || 0,
        statusDistribution,
        revenueByPeriod,
        timeRange
      }
    });
  } catch (error) {
    logger.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics'
    });
  }
};

// Get order overview
const getOverview = async (req, res) => {
  try {
    // Order status overview
    const statusOverview = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber status totalAmount createdAt');

    // Performance metrics
    const performanceStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] 
            } 
          },
          avgOrderValue: { 
            $avg: { 
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', null] 
            } 
          }
        }
      }
    ]);

    // Top customers by order count
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] 
            } 
          }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        statusOverview,
        recentOrders,
        performance: performanceStats[0] || {},
        topCustomers,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Get order overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order overview'
    });
  }
};

module.exports = {
  getStatistics,
  getOverview,
  assignDroneToOrder
};
