const User = require('../models/User');
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

// Get admin dashboard
const getDashboard = async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    // Calculate date range based on timeRange parameter
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

    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      newUsers,
      customerCount,
      restaurantCount,
      adminCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate } 
      }),
      User.countDocuments({ role: 'customer', active: true }),
      User.countDocuments({ role: 'restaurant', active: true }),
      User.countDocuments({ role: 'admin', active: true })
    ]);

    // Get data from other services
    let restaurantStats = {};
    let orderStats = {};
    let droneStats = {};

    try {
      // Get restaurant statistics
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/admin/statistics`, {
        headers: { Authorization: req.headers.authorization }
      });
      restaurantStats = restaurantResponse.data.data || {};
    } catch (error) {
      logger.warn('Failed to fetch restaurant statistics:', error.message);
    }

    try {
      // Get order statistics
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/admin/statistics`, {
        headers: { Authorization: req.headers.authorization }
      });
      orderStats = orderResponse.data.data || {};
    } catch (error) {
      logger.warn('Failed to fetch order statistics:', error.message);
    }

    try {
      // Get drone statistics
      const droneResponse = await axios.get(`${config.DRONE_SERVICE_URL}/api/admin/statistics`, {
        headers: { Authorization: req.headers.authorization }
      });
      droneStats = droneResponse.data.data || {};
    } catch (error) {
      logger.warn('Failed to fetch drone statistics:', error.message);
    }

    const dashboardData = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        customers: customerCount,
        restaurants: restaurantCount,
        admins: adminCount
      },
      restaurants: restaurantStats,
      orders: orderStats,
      drones: droneStats,
      timeRange,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
};

// Get overview statistics
const getOverview = async (req, res) => {
  try {
    // Get basic user counts
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$active', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt active');

    // Aggregate data from other services
    let aggregatedData = {
      users: userStats,
      recentUsers,
      restaurants: {},
      orders: {},
      drones: {}
    };

    // Try to get data from other services
    const services = [
      { name: 'restaurants', url: `${config.RESTAURANT_SERVICE_URL}/api/admin/overview` },
      { name: 'orders', url: `${config.ORDER_SERVICE_URL}/api/admin/overview` },
      { name: 'drones', url: `${config.DRONE_SERVICE_URL}/api/admin/overview` }
    ];

    await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url, {
            headers: { Authorization: req.headers.authorization },
            timeout: 5000
          });
          aggregatedData[service.name] = response.data.data || {};
        } catch (error) {
          logger.warn(`Failed to fetch ${service.name} overview:`, error.message);
          aggregatedData[service.name] = {};
        }
      })
    );

    res.json({
      success: true,
      data: aggregatedData
    });
  } catch (error) {
    logger.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data'
    });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration analytics
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // User activity analytics
    const userActivity = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        userRegistrations,
        userActivity,
        period,
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // Database statistics
    const dbStats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ active: true }),
      inactiveUsers: await User.countDocuments({ active: false })
    };

    // System health
    const systemHealth = {
      userService: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };

    // Try to check other services health
    const serviceHealthChecks = [
      { name: 'restaurant', url: `${config.RESTAURANT_SERVICE_URL}/health` },
      { name: 'order', url: `${config.ORDER_SERVICE_URL}/health` },
      { name: 'drone', url: `${config.DRONE_SERVICE_URL}/health` },
      { name: 'payment', url: `${config.PAYMENT_SERVICE_URL}/health` }
    ];

    const serviceHealth = {};
    await Promise.allSettled(
      serviceHealthChecks.map(async (service) => {
        try {
          const response = await axios.get(service.url, { timeout: 3000 });
          serviceHealth[service.name] = response.status === 200 ? 'healthy' : 'unhealthy';
        } catch (error) {
          serviceHealth[service.name] = 'unhealthy';
        }
      })
    );

    res.json({
      success: true,
      data: {
        database: dbStats,
        system: systemHealth,
        services: serviceHealth
      }
    });
  } catch (error) {
    logger.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics'
    });
  }
};

module.exports = {
  getDashboard,
  getOverview,
  getAnalytics,
  getSystemStats
};
