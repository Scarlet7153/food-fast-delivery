const Order = require('../models/Order');
const mongoose = require('mongoose');

// Get restaurant stats
const getRestaurantStats = async (req, res) => {
try {
    const restaurantId = req.user.restaurantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's stats (use amount.total field from schema)
    const todayStats = await Order.aggregate([
    {
        $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: today },
        status: { $nin: ['CANCELLED'] }
        }
    },
    {
        $group: {
        _id: null,
        todayRevenue: { $sum: '$amount.total' },
        todayOrders: { $sum: 1 }
        }
    }
    ]);

    // Get active orders count
    const activeOrders = await Order.countDocuments({
    restaurantId,
    status: { $in: ['PLACED', 'CONFIRMED', 'COOKING', 'READY_FOR_PICKUP', 'IN_FLIGHT'] }
    });

    // Get overall stats (use amount.total and rating.overall)
    const overallStats = await Order.aggregate([
    {
        $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        status: { $nin: ['CANCELLED'] }
        }
    },
    {
        $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$amount.total' },
        averageRating: { $avg: '$rating.overall' },
        totalReviews: {
            $sum: {
            $cond: [{ $gt: ['$rating.overall', 0] }, 1, 0]
            }
        }
        }
    }
    ]);

    const stats = {
    todayRevenue: todayStats[0]?.todayRevenue || 0,
    todayOrders: todayStats[0]?.todayOrders || 0,
    activeOrders,
    totalOrders: overallStats[0]?.totalOrders || 0,
    totalRevenue: overallStats[0]?.totalRevenue || 0,
    averageRating: overallStats[0]?.averageRating || 0,
    totalReviews: overallStats[0]?.totalReviews || 0
    };

    res.json({
    success: true,
    data: { stats }
    });
} catch (error) {
    console.error('Error getting restaurant stats:', error);
    res.status(500).json({
    success: false,
    error: 'Internal server error'
    });
}
};

module.exports = {
getRestaurantStats
};