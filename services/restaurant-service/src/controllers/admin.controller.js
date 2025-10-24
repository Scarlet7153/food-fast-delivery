const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

// Get restaurant statistics
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
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      newRestaurants,
      totalMenuItems,
      averageRating
    ] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ status: 'active' }),
      Restaurant.countDocuments({ status: 'pending' }),
      Restaurant.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate } 
      }),
      MenuItem.countDocuments(),
      Restaurant.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    // Restaurant status distribution
    const statusDistribution = await Restaurant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top rated restaurants
    const topRatedRestaurants = await Restaurant.find({ status: 'active' })
      .sort({ rating: -1 })
      .limit(5)
      .select('name rating totalReviews');

    res.json({
      success: true,
      data: {
        total: totalRestaurants,
        active: activeRestaurants,
        pending: pendingRestaurants,
        new: newRestaurants,
        totalMenuItems,
        averageRating: averageRating[0]?.avgRating || 0,
        statusDistribution,
        topRated: topRatedRestaurants,
        timeRange
      }
    });
  } catch (error) {
    logger.error('Get restaurant statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant statistics'
    });
  }
};

// Get restaurant overview
const getOverview = async (req, res) => {
  try {
    // Restaurant status overview
    const statusOverview = await Restaurant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent restaurants
    const recentRestaurants = await Restaurant.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name status createdAt rating');

    // Restaurant performance
    const performanceStats = await Restaurant.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalRestaurants: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: '$totalReviews' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusOverview,
        recentRestaurants,
        performance: performanceStats[0] || {},
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Get restaurant overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant overview'
    });
  }
};

module.exports = {
  getStatistics,
  getOverview
};
