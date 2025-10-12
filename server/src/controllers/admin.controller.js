const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');

// Get admin dashboard
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get today's statistics
    const [
      todayOrders,
      todayMissions,
      activeDrones,
      pendingRestaurants,
      recentOrders,
      recentMissions
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      DeliveryMission.countDocuments({ createdAt: { $gte: startOfDay } }),
      Drone.countDocuments({ status: 'IN_FLIGHT' }),
      Restaurant.countDocuments({ approved: false }),
      Order.find({ createdAt: { $gte: startOfDay } })
        .populate('userId', 'name email')
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      DeliveryMission.find({ createdAt: { $gte: startOfDay } })
        .populate('orderId', 'orderNumber')
        .populate('restaurantId', 'name')
        .populate('droneId', 'name serial')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Get system overview
    const [
      totalUsers,
      totalRestaurants,
      totalDrones,
      totalOrders,
      totalMissions
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments({ approved: true }),
      Drone.countDocuments(),
      Order.countDocuments(),
      DeliveryMission.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRestaurants,
          totalDrones,
          totalOrders,
          totalMissions
        },
        today: {
          orders: todayOrders,
          missions: todayMissions,
          activeDrones,
          pendingRestaurants
        },
        recent: {
          orders: recentOrders,
          missions: recentMissions
        }
      }
    });

  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
};

// Get system overview
const getOverview = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    // Get aggregated statistics
    const [
      userStats,
      restaurantStats,
      orderStats,
      missionStats,
      droneStats
    ] = await Promise.all([
      User.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Restaurant.aggregate([
        { $match: { ...matchStage, approved: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            averageRating: { $avg: '$rating.average' },
            totalRevenue: { $sum: '$stats.totalRevenue' }
          }
        }
      ]),
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
            },
            totalRevenue: { $sum: '$amount.total' },
            averageOrderValue: { $avg: '$amount.total' }
          }
        }
      ]),
      DeliveryMission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalMissions: { $sum: 1 },
            completedMissions: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
            },
            averageDuration: { $avg: '$actuals.durationMinutes' },
            averageDistance: { $avg: '$actuals.distanceKm' }
          }
        }
      ]),
      Drone.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        restaurantStats: restaurantStats[0] || {
          total: 0,
          averageRating: 0,
          totalRevenue: 0
        },
        orderStats: orderStats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        missionStats: missionStats[0] || {
          totalMissions: 0,
          completedMissions: 0,
          averageDuration: 0,
          averageDistance: 0
        },
        droneStats
      }
    });

  } catch (error) {
    logger.error('Get system overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system overview'
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, active } = req.query;

    const query = {};
    if (role) query.role = role;
    if (active !== undefined) query.active = active === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('restaurantId', 'name address')
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('restaurantId', 'name address rating stats')
      .select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's orders if customer
    let orders = [];
    if (user.role === 'customer') {
      orders = await Order.find({ userId: user._id })
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get restaurant's stats if restaurant owner
    let restaurantStats = null;
    if (user.role === 'restaurant' && user.restaurantId) {
      restaurantStats = await Order.getStatistics(user.restaurantId._id);
    }

    res.json({
      success: true,
      data: {
        user,
        orders,
        restaurantStats: restaurantStats?.[0] || null
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { active },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If deactivating user, also deactivate their restaurant
    if (!active && user.restaurantId) {
      await Restaurant.findByIdAndUpdate(user.restaurantId, { active: false });
    }

    logger.info(`Admin ${req.user.email} updated user status: ${user.email} - ${active ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      message: `User ${active ? 'activated' : 'deactivated'} successfully`,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
};

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 20, approved, active, search } = req.query;

    const query = {};
    if (approved !== undefined) query.approved = approved === 'true';
    if (active !== undefined) query.active = active === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('ownerUserId', 'name email phone')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Restaurant.countDocuments(query);

    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants'
    });
  }
};

// Get pending restaurants
const getPendingRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const restaurants = await Restaurant.find({ approved: false })
      .populate('ownerUserId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Restaurant.countDocuments({ approved: false });

    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get pending restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending restaurants'
    });
  }
};

// Get single restaurant
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id)
      .populate('ownerUserId', 'name email phone')
      .populate('approvedBy', 'name email');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Get restaurant statistics
    const [orderStats, droneCount, menuItemCount] = await Promise.all([
      Order.getStatistics(restaurant._id),
      Drone.countDocuments({ restaurantId: restaurant._id }),
      require('../models/MenuItem').countDocuments({ restaurantId: restaurant._id })
    ]);

    res.json({
      success: true,
      data: {
        restaurant,
        statistics: {
          orders: orderStats[0] || {
            totalOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            completionRate: 0
          },
          droneCount,
          menuItemCount
        }
      }
    });

  } catch (error) {
    logger.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant'
    });
  }
};

// Approve restaurant
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    if (restaurant.approved) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is already approved'
      });
    }

    restaurant.approved = true;
    restaurant.active = true;
    restaurant.approvedBy = req.user._id;
    restaurant.approvedAt = new Date();

    await restaurant.save();

    logger.info(`Restaurant approved: ${restaurant.name} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Restaurant approved successfully',
      data: {
        restaurant
      }
    });

  } catch (error) {
    logger.error('Approve restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve restaurant'
    });
  }
};

// Reject restaurant
const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    if (restaurant.approved) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is already approved'
      });
    }

    // Delete the restaurant (or mark as rejected)
    await Restaurant.findByIdAndDelete(id);

    logger.info(`Restaurant rejected: ${restaurant.name} by admin ${req.user.email}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Restaurant rejected successfully'
    });

  } catch (error) {
    logger.error('Reject restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject restaurant'
    });
  }
};

// Update restaurant status
const updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { active },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    logger.info(`Admin ${req.user.email} updated restaurant status: ${restaurant.name} - ${active ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      message: `Restaurant ${active ? 'activated' : 'deactivated'} successfully`,
      data: {
        restaurant
      }
    });

  } catch (error) {
    logger.error('Update restaurant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant status'
    });
  }
};

// Get all orders
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

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const { restaurantId, dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (restaurantId) matchStage.restaurantId = restaurantId;
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$amount.total' },
          averageOrderValue: { $avg: '$amount.total' },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        statusBreakdown
      }
    });

  } catch (error) {
    logger.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order statistics'
    });
  }
};

// Get all drones
const getAllDrones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      restaurantId,
      maintenance 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (restaurantId) query.restaurantId = restaurantId;
    if (maintenance === 'due') {
      query['maintenance.nextMaintenance'] = { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) };
    }

    const drones = await Drone.find(query)
      .populate('restaurantId', 'name address')
      .populate('currentMission', 'status orderId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Drone.countDocuments(query);

    res.json({
      success: true,
      data: {
        drones,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all drones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drones'
    });
  }
};

// Get drone statistics
const getDroneStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const droneStats = await Drone.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDrones: { $sum: 1 },
          activeDrones: {
            $sum: { $cond: [{ $eq: ['$status', 'IDLE'] }, 1, 0] }
          },
          inFlightDrones: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_FLIGHT'] }, 1, 0] }
          },
          averageBattery: { $avg: '$batteryPercent' }
        }
      }
    ]);

    const statusBreakdown = await Drone.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        droneStatistics: droneStats[0] || {
          totalDrones: 0,
          activeDrones: 0,
          inFlightDrones: 0,
          averageBattery: 0
        },
        statusBreakdown
      }
    });

  } catch (error) {
    logger.error('Get drone statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drone statistics'
    });
  }
};

// Get all missions
const getAllMissions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      restaurantId,
      dateFrom, 
      dateTo 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (restaurantId) query.restaurantId = restaurantId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const missions = await DeliveryMission.find(query)
      .populate('orderId', 'orderNumber amount deliveryAddress')
      .populate('restaurantId', 'name address')
      .populate('droneId', 'name serial status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await DeliveryMission.countDocuments(query);

    res.json({
      success: true,
      data: {
        missions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all missions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get missions'
    });
  }
};

// Get mission statistics
const getMissionStatistics = async (req, res) => {
  try {
    const { restaurantId, dateFrom, dateTo } = req.query;

    const stats = await DeliveryMission.getStatistics(restaurantId, dateFrom, dateTo);

    const statusBreakdown = await DeliveryMission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalMissions: 0,
          completedMissions: 0,
          failedMissions: 0,
          abortedMissions: 0,
          successRate: 0,
          averageDuration: 0,
          averageDistance: 0,
          averageBatteryConsumption: 0
        },
        statusBreakdown
      }
    });

  } catch (error) {
    logger.error('Get mission statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mission statistics'
    });
  }
};

// Get system statistics
const getSystemStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const [
      userStats,
      restaurantStats,
      orderStats,
      missionStats,
      droneStats
    ] = await Promise.all([
      User.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Restaurant.aggregate([
        { $match: { ...matchStage, approved: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            averageRating: { $avg: '$rating.average' }
          }
        }
      ]),
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$amount.total' },
            averageOrderValue: { $avg: '$amount.total' }
          }
        }
      ]),
      DeliveryMission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalMissions: { $sum: 1 },
            successRate: {
              $avg: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 100, 0] }
            }
          }
        }
      ]),
      Drone.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDrones: { $sum: 1 },
            averageBattery: { $avg: '$batteryPercent' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        restaurantStats: restaurantStats[0] || { total: 0, averageRating: 0 },
        orderStats: orderStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
        missionStats: missionStats[0] || { totalMissions: 0, successRate: 0 },
        droneStats: droneStats[0] || { totalDrones: 0, averageBattery: 0 }
      }
    });

  } catch (error) {
    logger.error('Get system statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system statistics'
    });
  }
};

module.exports = {
  getDashboard,
  getOverview,
  getAllUsers,
  getUser,
  updateUserStatus,
  getAllRestaurants,
  getPendingRestaurants,
  getRestaurant,
  approveRestaurant,
  rejectRestaurant,
  updateRestaurantStatus,
  getAllOrders,
  getOrderStatistics,
  getAllDrones,
  getDroneStatistics,
  getAllMissions,
  getMissionStatistics,
  getSystemStatistics
};
