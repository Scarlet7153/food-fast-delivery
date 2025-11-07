const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Create delivery mission (Admin)
const createMission = async (req, res) => {
  try {
    const { orderId, droneId, restaurantId } = req.body;
    
    // Validate inputs
    if (!orderId || !droneId || !restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'orderId, droneId, and restaurantId are required'
      });
    }
    
    // Get order details
    let order;
    try {
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/orders/${orderId}`);
      order = orderResponse.data.data.order;
    } catch (error) {
      logger.error('Failed to fetch order:', error);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Verify drone exists and belongs to restaurant
    const drone = await Drone.findOne({ _id: droneId, restaurantId });
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found or does not belong to the restaurant'
      });
    }
    
    // Check if drone is available
    if (drone.status !== 'IDLE') {
      return res.status(400).json({
        success: false,
        error: `Drone is not available (current status: ${drone.status})`
      });
    }
    
    // Calculate route and estimates
    const pickupLocation = [106.6297, 10.8231]; // Restaurant location (default)
    const deliveryLocation = order.deliveryAddress.location.coordinates;
    
    const distance = calculateDistance(
      pickupLocation[1], pickupLocation[0], // lat, lng
      deliveryLocation[1], deliveryLocation[0]
    );
    
    const etaMinutes = Math.ceil(distance * 2); // Rough estimate: 2 minutes per km
    const batteryConsumption = Math.ceil(distance * 5); // Rough estimate: 5% per km
    
    const missionData = {
      orderId,
      restaurantId,
      droneId,
      route: {
        pickup: {
          location: {
            type: 'Point',
            coordinates: pickupLocation
          },
          address: 'Restaurant Location',
          instructions: 'Pick up order from restaurant'
        },
        delivery: {
          location: {
            type: 'Point',
            coordinates: deliveryLocation
          },
          address: order.deliveryAddress.text,
          instructions: order.deliveryAddress.notes || 'Deliver to customer',
          contactPhone: order.deliveryAddress.contactPhone,
          contactName: order.deliveryAddress.contactName
        }
      },
      estimates: {
        distanceKm: Math.round(distance * 100) / 100,
        etaMinutes,
        batteryConsumption: Math.min(batteryConsumption, 80) // Max 80% consumption
      },
      parameters: {
        payloadWeight: order.items.reduce((total, item) => total + (item.weightGrams || 200) * item.quantity, 0)
      }
    };
    
    const mission = new DeliveryMission(missionData);
    await mission.save();
    
    // Update drone status and assign mission
    drone.status = 'BUSY';
    drone.currentMission = mission._id;
    await drone.save();
    
    logger.info(`Admin created delivery mission: ${mission.missionNumber} for order ${orderId}`);
    
    res.status(201).json({
      success: true,
      message: 'Delivery mission created successfully',
      data: {
        mission
      }
    });
    
  } catch (error) {
    logger.error('Create mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery mission'
    });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Get all drones for admin
const getAllDrones = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, restaurantId, search } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (restaurantId && restaurantId !== 'all') query.restaurantId = restaurantId;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const drones = await Drone.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Drone.countDocuments(query);
    
    // Fetch restaurant information for all drones
    const restaurantIds = [...new Set(drones.map(d => d.restaurantId?.toString()).filter(Boolean))];
    let restaurantsMap = {};
    
    if (restaurantIds.length > 0) {
      try {
        const restaurantsPromises = restaurantIds.map(id =>
          axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${id}`)
            .then(res => ({ id, restaurant: res.data.data.restaurant }))
            .catch(() => ({ id, restaurant: null }))
        );
        
        const restaurantsData = await Promise.all(restaurantsPromises);
        restaurantsMap = restaurantsData.reduce((map, { id, restaurant }) => {
          if (restaurant) map[id] = restaurant;
          return map;
        }, {});
      } catch (error) {
        logger.warn('Failed to fetch some restaurant details:', error);
      }
    }
    
    // Fetch current missions for drones
    const droneIds = drones.map(d => d._id);
    const currentMissions = await DeliveryMission.find({
      droneId: { $in: droneIds },
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_FLIGHT'] }
    }).lean();
    
    const missionsMap = currentMissions.reduce((map, mission) => {
      map[mission.droneId.toString()] = mission;
      return map;
    }, {});
    
    // Transform drones to include restaurant info and current mission
    const dronesWithRestaurants = drones.map(drone => ({
      ...drone,
      restaurant: restaurantsMap[drone.restaurantId?.toString()] || null,
      currentMission: missionsMap[drone._id.toString()] || null,
      lastUpdatedAt: drone.updatedAt
    }));
    
    // Get ALL unique restaurants for filter dropdown (not just from current page)
    let allRestaurantsForFilter = [];
    try {
      // Fetch approved restaurants from restaurant service (internal endpoint)
      const restaurantsResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/internal/restaurants`, {
        params: { 
          limit: 1000
        }
      });
      
      if (restaurantsResponse.data.success && restaurantsResponse.data.data.restaurants) {
        allRestaurantsForFilter = restaurantsResponse.data.data.restaurants;
      }
    } catch (error) {
      logger.warn('Failed to fetch restaurants for filter:', error.message);
    }
    
    res.json({
      success: true,
      data: {
        drones: dronesWithRestaurants,
        restaurants: allRestaurantsForFilter,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get all drones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drones'
    });
  }
};

// Get drone by ID for admin
const getDroneById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const drone = await Drone.findById(id).lean();
      
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Fetch restaurant information
    let restaurant = null;
    if (drone.restaurantId) {
      try {
        const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${drone.restaurantId}`);
        restaurant = restaurantResponse.data.data.restaurant;
      } catch (error) {
        logger.warn('Failed to fetch restaurant details:', error);
      }
    }
    
    // Fetch and enrich current mission
    let currentMission = null;
    if (drone.currentMission) {
      try {
        const mission = await DeliveryMission.findById(drone.currentMission)
          .select('_id missionNumber orderId restaurantId status createdAt')
          .lean();
        
        if (mission) {
          // Fetch order info
          let orderInfo = null;
          if (mission.orderId) {
            try {
              const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/internal/orders/${mission.orderId}`);
              orderInfo = {
                orderNumber: orderResponse.data.data.order.orderNumber
              };
            } catch (error) {
              logger.warn('Failed to fetch order details for current mission:', error);
            }
          }
          
          // Fetch restaurant info for mission
          let missionRestaurant = null;
          if (mission.restaurantId) {
            try {
              const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${mission.restaurantId}`);
              missionRestaurant = restaurantResponse.data.data.restaurant;
            } catch (error) {
              logger.warn('Failed to fetch restaurant details for current mission:', error);
            }
          }
          
          currentMission = {
            ...mission,
            orderId: orderInfo,
            restaurant: missionRestaurant
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch current mission:', error);
      }
    }
    
    // Fetch recent missions
    let recentMissions = [];
    try {
      recentMissions = await DeliveryMission.find({ droneId: id })
        .select('_id missionNumber orderId restaurantId status createdAt completedAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      // Enrich missions with restaurant info
      const missionRestaurantIds = [...new Set(recentMissions.map(m => m.restaurantId?.toString()).filter(Boolean))];
      
      if (missionRestaurantIds.length > 0) {
        const restaurantsPromises = missionRestaurantIds.map(id =>
          axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/${id}`)
            .then(res => ({ id, restaurant: res.data.data.restaurant }))
            .catch(() => ({ id, restaurant: null }))
        );
        
        const restaurantsData = await Promise.all(restaurantsPromises);
        const restaurantsMap = restaurantsData.reduce((map, { id, restaurant }) => {
          if (restaurant) map[id] = restaurant;
          return map;
        }, {});
        
        // Add restaurant info to missions
        recentMissions = recentMissions.map(mission => ({
          ...mission,
          restaurant: restaurantsMap[mission.restaurantId?.toString()] || null
        }));
      }
    } catch (error) {
      logger.warn('Failed to fetch recent missions:', error);
    }
    
    res.json({
      success: true,
      data: {
        drone: {
          ...drone,
          restaurant,
          currentMission,
          recentMissions,
          lastUpdatedAt: drone.updatedAt
        }
      }
    });
    
  } catch (error) {
    logger.error('Get drone by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drone'
    });
  }
};

// Update drone status (admin)
const updateDroneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    await drone.updateStatus(status);
    
    logger.info(`Admin updated drone status: ${drone.name} to ${status}`);
    
    res.json({
      success: true,
      message: 'Drone status updated successfully',
      data: {
        drone
      }
    });
    
  } catch (error) {
    logger.error('Update drone status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update drone status'
    });
  }
};

// Get drone statistics
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
      totalDrones,
      idleDrones,
      busyDrones,
      totalMissions,
      completedMissions,
      inProgressMissions,
      failedMissions
    ] = await Promise.all([
      Drone.countDocuments(),
      Drone.countDocuments({ status: 'IDLE' }),
      Drone.countDocuments({ status: 'BUSY' }),
      DeliveryMission.countDocuments(),
      DeliveryMission.countDocuments({ status: 'completed' }),
      DeliveryMission.countDocuments({ status: { $in: ['assigned', 'in_progress', 'returning'] } }),
      DeliveryMission.countDocuments({ status: 'failed' })
    ]);

    // Drone status distribution
    const droneStatusDistribution = await Drone.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Mission status distribution
    const missionStatusDistribution = await DeliveryMission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Mission completion rate
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Flight time statistics
    const flightTimeStats = await DeliveryMission.aggregate([
      {
        $match: {
          status: 'completed',
          startTime: { $exists: true },
          endTime: { $exists: true }
        }
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$endTime', '$startTime'] },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgFlightTime: { $avg: '$duration' },
          totalFlightTime: { $sum: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        drones: {
          total: totalDrones,
          idle: idleDrones,
          busy: busyDrones,
          statusDistribution: droneStatusDistribution
        },
        missions: {
          total: totalMissions,
          completed: completedMissions,
          inProgress: inProgressMissions,
          failed: failedMissions,
          completionRate,
          statusDistribution: missionStatusDistribution,
          flightStats: flightTimeStats[0] || {}
        },
        timeRange
      }
    });
  } catch (error) {
    logger.error('Get drone statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone statistics'
    });
  }
};

// Get drone overview
const getOverview = async (req, res) => {
  try {
    // Drone status overview
    const droneStatusOverview = await Drone.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Mission status overview
    const missionStatusOverview = await DeliveryMission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent missions
    const recentMissions = await DeliveryMission.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('missionId status droneId startTime endTime')
      .populate('droneId', 'name model');

  // Low battery info removed from simplified model
  const lowBatteryDrones = [];

    // Performance metrics
    const performanceStats = await DeliveryMission.aggregate([
      {
        $group: {
          _id: null,
          totalMissions: { $sum: 1 },
          successRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        droneStatusOverview,
        missionStatusOverview,
        recentMissions,
        lowBatteryDrones,
        performance: performanceStats[0] || {},
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Get drone overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone overview'
    });
  }
};

module.exports = {
  getAllDrones,
  getDroneById,
  updateDroneStatus,
  getStatistics,
  getOverview,
  createMission
};
