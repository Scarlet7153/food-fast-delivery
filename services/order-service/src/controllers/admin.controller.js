const Order = require('../models/Order');
const logger = require('../utils/logger');

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
  getOverview
};
