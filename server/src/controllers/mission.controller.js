const DeliveryMission = require('../models/DeliveryMission');
const Order = require('../models/Order');
const Drone = require('../models/Drone');
const { generateWaypoints, calculateFlightPathDistance, estimateBatteryConsumption } = require('../utils/geo');
const logger = require('../utils/logger');

// Create mission
const createMission = async (req, res) => {
  try {
    const { orderId, droneId } = req.body;

    // Validate order exists and belongs to user's restaurant
    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.user.restaurantId,
      status: 'READY_FOR_PICKUP'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not ready for pickup'
      });
    }

    // Validate drone exists and belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: droneId,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Check if drone is available
    if (!drone.isAvailable()) {
      return res.status(400).json({
        success: false,
        error: `Drone is not available. Status: ${drone.status}, Battery: ${drone.batteryPercent}%`
      });
    }

    // Check if drone already has an active mission
    if (drone.currentMission) {
      return res.status(400).json({
        success: false,
        error: 'Drone already has an active mission'
      });
    }

    // Calculate total weight of order
    const totalWeight = order.items.reduce((sum, item) => sum + (item.weightGrams || 0) * item.quantity, 0);

    // Check payload capacity
    if (totalWeight > drone.payloadMaxGrams) {
      return res.status(400).json({
        success: false,
        error: `Order weight (${totalWeight}g) exceeds drone capacity (${drone.payloadMaxGrams}g)`
      });
    }

    // Calculate distance and estimates
    const restaurantLat = order.restaurant.location.coordinates[1];
    const restaurantLng = order.restaurant.location.coordinates[0];
    const deliveryLat = order.deliveryAddress.location.coordinates[1];
    const deliveryLng = order.deliveryAddress.location.coordinates[0];

    const distance = drone.calculateDistance(restaurantLat, restaurantLng, deliveryLat, deliveryLng);

    // Check if delivery location is within drone range
    if (distance > drone.rangeKm) {
      return res.status(400).json({
        success: false,
        error: `Delivery location (${distance.toFixed(2)}km) is outside drone range (${drone.rangeKm}km)`
      });
    }

    // Check if delivery location is within geofence
    if (!drone.isWithinGeofence(deliveryLat, deliveryLng)) {
      return res.status(400).json({
        success: false,
        error: 'Delivery location is outside drone geofence'
      });
    }

    // Estimate battery consumption
    const estimatedBatteryConsumption = estimateBatteryConsumption(distance, totalWeight);
    if (drone.batteryPercent < estimatedBatteryConsumption + 20) { // Reserve 20% for safety
      return res.status(400).json({
        success: false,
        error: `Insufficient battery. Required: ${estimatedBatteryConsumption}%, Available: ${drone.batteryPercent}%`
      });
    }

    // Generate waypoints
    const waypoints = generateWaypoints(restaurantLat, restaurantLng, deliveryLat, deliveryLng);

    // Calculate estimates
    const etaMinutes = Math.round((distance / drone.speedKmh) * 60) + 10; // Add 10 minutes for takeoff/landing

    // Create mission
    const mission = new DeliveryMission({
      orderId: order._id,
      restaurantId: req.user.restaurantId,
      droneId: drone._id,
      route: {
        pickup: {
          location: order.restaurant.location,
          address: order.restaurant.address,
          instructions: 'Pick up food order'
        },
        delivery: {
          location: order.deliveryAddress.location,
          address: order.deliveryAddress.text,
          instructions: order.deliveryAddress.notes || 'Deliver to customer',
          contactPhone: order.deliveryAddress.contactPhone,
          contactName: order.deliveryAddress.contactName
        },
        waypoints: waypoints.map((waypoint, index) => ({
          location: {
            type: 'Point',
            coordinates: [waypoint.longitude, waypoint.latitude]
          },
          altitude: waypoint.altitude,
          speed: drone.speedKmh,
          action: index === 0 ? 'TAKEOFF' : 
                  index === waypoints.length - 1 ? 'LANDING' : 
                  'CRUISING'
        }))
      },
      estimates: {
        distanceKm: Math.round(distance * 100) / 100,
        etaMinutes,
        batteryConsumption: estimatedBatteryConsumption
      },
      parameters: {
        maxAltitude: drone.maxAltitude || 120,
        maxSpeed: drone.speedKmh,
        payloadWeight: totalWeight,
        emergencyContact: {
          name: req.user.name,
          phone: req.user.phone
        }
      },
      status: 'QUEUED',
      timeline: [{
        status: 'QUEUED',
        timestamp: new Date(),
        note: 'Mission created and queued'
      }]
    });

    await mission.save();

    // Update drone status and current mission
    drone.currentMission = mission._id;
    await drone.updateStatus('PREPARING');

    // Update order status
    await order.updateStatus('IN_FLIGHT', req.user._id, 'Drone mission created');

    logger.info(`Mission created: ${mission.missionNumber} for order ${order.orderNumber}`);

    res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Create mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mission'
    });
  }
};

// Get missions
const getMissions = async (req, res) => {
  try {
    const { status, droneId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view missions'
      });
    }

    const options = {};
    if (status) options.status = status;
    if (droneId) options.droneId = droneId;

    const missions = await DeliveryMission.findByRestaurant(req.user.restaurantId, {
      ...options,
      dateFrom,
      dateTo
    })
      .populate('orderId', 'orderNumber amount deliveryAddress')
      .populate('droneId', 'name serial status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await DeliveryMission.countDocuments({ 
      restaurantId: req.user.restaurantId, 
      ...options 
    });

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
    logger.error('Get missions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get missions'
    });
  }
};

// Get single mission
const getMission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view missions'
      });
    }

    const mission = await DeliveryMission.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    })
      .populate('orderId', 'orderNumber items amount deliveryAddress timeline')
      .populate('droneId', 'name serial status location batteryPercent')
      .populate('restaurantId', 'name address');

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    res.json({
      success: true,
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Get mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mission'
    });
  }
};

// Update mission status
const updateMissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update missions'
      });
    }

    // Check if mission belongs to user's restaurant
    const mission = await DeliveryMission.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    }).populate('orderId droneId');

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    await mission.updateStatus(status, note);

    // Update drone status based on mission status
    const drone = await Drone.findById(mission.droneId);
    if (drone) {
      switch (status) {
        case 'TAKEOFF':
        case 'CRUISING':
        case 'APPROACHING':
          await drone.updateStatus('IN_FLIGHT');
          break;
        case 'DELIVERED':
          await drone.updateStatus('RETURNING');
          break;
        case 'COMPLETED':
          await drone.updateStatus('IDLE');
          drone.currentMission = undefined;
          await drone.save();
          break;
        case 'ABORTED':
        case 'FAILED':
          await drone.updateStatus('IDLE');
          drone.currentMission = undefined;
          await drone.save();
          break;
      }
    }

    // Update order status based on mission status
    if (mission.orderId) {
      switch (status) {
        case 'TAKEOFF':
          await mission.orderId.updateStatus('IN_FLIGHT', req.user._id, 'Drone taking off');
          break;
        case 'DELIVERED':
          await mission.orderId.updateStatus('DELIVERED', req.user._id, 'Order delivered by drone');
          break;
        case 'ABORTED':
        case 'FAILED':
          await mission.orderId.updateStatus('FAILED', req.user._id, 'Delivery mission failed');
          break;
      }
    }

    logger.info(`Mission status updated: ${mission.missionNumber} - ${status}`);

    res.json({
      success: true,
      message: 'Mission status updated successfully',
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Update mission status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update mission status'
    });
  }
};

// Update mission path
const updateMissionPath = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, altitude, heading, speed, batteryPercent } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update mission path'
      });
    }

    // Check if mission belongs to user's restaurant
    const mission = await DeliveryMission.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    await mission.addPathPoint(latitude, longitude, altitude, heading, speed, batteryPercent);

    // Update drone location
    const drone = await Drone.findById(mission.droneId);
    if (drone) {
      await drone.updateLocation(longitude, latitude, altitude, heading);
      await drone.updateBattery(batteryPercent);
    }

    logger.info(`Mission path updated: ${mission.missionNumber} - ${latitude}, ${longitude}`);

    res.json({
      success: true,
      message: 'Mission path updated successfully',
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Update mission path error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mission path'
    });
  }
};

// Abort mission
const abortMission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, code = 'ABORTED_BY_OPERATOR', description } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to abort missions'
      });
    }

    // Check if mission belongs to user's restaurant
    const mission = await DeliveryMission.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    }).populate('orderId droneId');

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Get current location from path
    const currentLocation = mission.path.length > 0 ? {
      latitude: mission.path[mission.path.length - 1].latitude,
      longitude: mission.path[mission.path.length - 1].longitude,
      altitude: mission.path[mission.path.length - 1].altitude
    } : null;

    await mission.abortMission(reason, code, description, currentLocation);

    // Update drone status
    const drone = await Drone.findById(mission.droneId);
    if (drone) {
      await drone.updateStatus('IDLE');
      drone.currentMission = undefined;
      await drone.save();
    }

    // Update order status
    if (mission.orderId) {
      await mission.orderId.updateStatus('FAILED', req.user._id, 'Delivery mission aborted');
    }

    logger.info(`Mission aborted: ${mission.missionNumber} - ${reason}`);

    res.json({
      success: true,
      message: 'Mission aborted successfully',
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Abort mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abort mission'
    });
  }
};

// Complete mission
const completeMission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to complete missions'
      });
    }

    // Check if mission belongs to user's restaurant
    const mission = await DeliveryMission.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    }).populate('orderId droneId');

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    await mission.completeMission();

    // Update drone status
    const drone = await Drone.findById(mission.droneId);
    if (drone) {
      await drone.updateStatus('IDLE');
      drone.currentMission = undefined;
      
      // Record flight metrics
      if (mission.actuals.durationMinutes) {
        await drone.recordFlight(mission.actuals.durationMinutes, true);
      }
      
      await drone.save();
    }

    logger.info(`Mission completed: ${mission.missionNumber}`);

    res.json({
      success: true,
      message: 'Mission completed successfully',
      data: {
        mission
      }
    });

  } catch (error) {
    logger.error('Complete mission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete mission'
    });
  }
};

// Get all missions (admin)
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

// Get mission statistics (admin)
const getMissionStatistics = async (req, res) => {
  try {
    const { restaurantId, dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (restaurantId) matchStage.restaurantId = restaurantId;
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const stats = await DeliveryMission.getStatistics(restaurantId, dateFrom, dateTo);

    // Get status breakdown
    const statusBreakdown = await DeliveryMission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing restaurants
    const topRestaurants = await DeliveryMission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$restaurantId',
          totalMissions: { $sum: 1 },
          completedMissions: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          successRate: {
            $avg: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 100, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      {
        $project: {
          restaurantName: '$restaurant.name',
          totalMissions: 1,
          completedMissions: 1,
          successRate: { $round: ['$successRate', 2] }
        }
      },
      { $sort: { successRate: -1 } },
      { $limit: 10 }
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
        statusBreakdown,
        topRestaurants
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

module.exports = {
  createMission,
  getMissions,
  getMission,
  updateMissionStatus,
  updateMissionPath,
  abortMission,
  completeMission,
  getAllMissions,
  getMissionStatistics
};
