const DeliveryMission = require('../models/DeliveryMission');
const Drone = require('../models/Drone');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Create delivery mission
const createMission = async (req, res) => {
  try {
    const { orderId, droneId } = req.body;
    
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
    
    // Get order details
    let order;
    try {
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/orders/${orderId}`);
      order = orderResponse.data.data.order;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Verify drone belongs to restaurant
    const drone = await Drone.findOne({ _id: droneId, restaurantId });
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found or does not belong to your restaurant'
      });
    }
    
    // Check if drone is available
    if (!drone.isAvailable()) {
      return res.status(400).json({
        success: false,
        error: 'Drone is not available for missions'
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
    drone.status = 'IN_FLIGHT';
    drone.currentMission = mission._id;
    await drone.save();
    
    // Update order status
    try {
      await axios.patch(`${config.ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
        status: 'IN_FLIGHT',
        note: `Drone ${drone.name} assigned to delivery mission ${mission.missionNumber}`
      });
    } catch (error) {
      logger.warn('Failed to update order status:', error);
    }
    
    logger.info(`New delivery mission created: ${mission.missionNumber} for order ${orderId}`);
    
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

// Get missions for restaurant
const getRestaurantMissions = async (req, res) => {
  try {
    const { status, droneId, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    
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
    if (droneId) options.droneId = droneId;
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;
    
    const missions = await DeliveryMission.findByRestaurant(restaurantId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await DeliveryMission.countDocuments({ restaurantId, ...options });
    
    res.json({
      success: true,
      data: {
        missions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant missions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get missions'
    });
  }
};

// Get mission by ID
const getMissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mission = await DeliveryMission.findById(id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (mission.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this mission'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        mission
      }
    });
    
  } catch (error) {
    logger.error('Get mission by ID error:', error);
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
    
    const mission = await DeliveryMission.findById(id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (mission.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this mission'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    await mission.updateStatus(status, note);
    
    // Update drone status if mission is completed
    if (status === 'COMPLETED') {
      const drone = await Drone.findById(mission.droneId);
      if (drone) {
        drone.status = 'IDLE';
        drone.currentMission = undefined;
        await drone.save();
      }
    }
    
    // Update order status
    try {
      let orderStatus;
      switch (status) {
        case 'DELIVERED':
          orderStatus = 'DELIVERED';
          break;
        case 'COMPLETED':
          orderStatus = 'DELIVERED';
          break;
        case 'FAILED':
        case 'ABORTED':
          orderStatus = 'FAILED';
          break;
        default:
          orderStatus = 'IN_FLIGHT';
      }
      
      await axios.patch(`${config.ORDER_SERVICE_URL}/api/orders/${mission.orderId}/status`, {
        status: orderStatus,
        note: `Mission ${status}: ${note || mission.getStatusNote(status)}`
      });
    } catch (error) {
      logger.warn('Failed to update order status:', error);
    }
    
    // Emit status update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${mission.restaurantId}`).emit('mission-status-update', {
        missionId: mission._id,
        status,
        note,
        timestamp: new Date()
      });
    }
    
    logger.info(`Mission status updated: ${mission.missionNumber} to ${status}`);
    
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

// Add path point to mission
const addPathPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, altitude, heading, speed, batteryPercent } = req.body;
    
    const mission = await DeliveryMission.findById(id);
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
      await drone.updateLocation(latitude, longitude);
    }
    
    // Emit location update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${mission.restaurantId}`).emit('mission-path-update', {
        missionId: mission._id,
        location: { latitude, longitude, altitude },
        batteryPercent,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Path point added successfully',
      data: {
        mission
      }
    });
    
  } catch (error) {
    logger.error('Add path point error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add path point'
    });
  }
};

// Get mission statistics
const getMissionStatistics = async (req, res) => {
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
    
    const stats = await DeliveryMission.getStatistics(restaurantId, dateFrom, dateTo);
    
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
        }
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

module.exports = {
  createMission,
  getRestaurantMissions,
  getMissionById,
  updateMissionStatus,
  addPathPoint,
  getMissionStatistics
};
