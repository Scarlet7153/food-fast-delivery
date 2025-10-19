const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Get all drones for restaurant
const getRestaurantDrones = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
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
    
    const query = { restaurantId };
    if (status) query.status = status;
    
    const drones = await Drone.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Drone.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        drones,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant drones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drones'
    });
  }
};

// Get drone by ID
const getDroneById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (drone.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this drone'
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
        drone
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

// Create drone
const createDrone = async (req, res) => {
  try {
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
    
    const droneData = {
      ...req.body,
      restaurantId
    };
    
    const drone = new Drone(droneData);
    await drone.save();
    
    logger.info(`New drone created: ${drone.name} for restaurant ${restaurantId}`);
    
    res.status(201).json({
      success: true,
      message: 'Drone created successfully',
      data: {
        drone
      }
    });
    
  } catch (error) {
    logger.error('Create drone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create drone'
    });
  }
};

// Update drone
const updateDrone = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (drone.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this drone'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const updatedDrone = await Drone.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Drone updated: ${updatedDrone.name}`);
    
    res.json({
      success: true,
      message: 'Drone updated successfully',
      data: {
        drone: updatedDrone
      }
    });
    
  } catch (error) {
    logger.error('Update drone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drone'
    });
  }
};

// Update drone status
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
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (drone.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this drone'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    await drone.updateStatus(status);
    
    logger.info(`Drone status updated: ${drone.name} to ${status}`);
    
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

// Update drone location
const updateDroneLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    await drone.updateLocation(lat, lng);
    
    // Emit location update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${drone.restaurantId}`).emit('drone-location-update', {
        droneId: drone._id,
        location: { lat, lng },
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Drone location updated successfully',
      data: {
        drone
      }
    });
    
  } catch (error) {
    logger.error('Update drone location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drone location'
    });
  }
};

// Schedule maintenance
const scheduleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { daysFromNow = 30 } = req.body;
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Check if user owns the restaurant
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      const restaurant = restaurantResponse.data.data.restaurant;
      
      if (drone.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to schedule maintenance for this drone'
        });
      }
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    await drone.scheduleMaintenance(daysFromNow);
    
    logger.info(`Maintenance scheduled for drone: ${drone.name}`);
    
    res.json({
      success: true,
      message: 'Maintenance scheduled successfully',
      data: {
        drone
      }
    });
    
  } catch (error) {
    logger.error('Schedule maintenance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule maintenance'
    });
  }
};

// Get available drones
const getAvailableDrones = async (req, res) => {
  try {
    const { minBattery = 30 } = req.query;
    
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
    
    const drones = await Drone.findAvailable(restaurantId, parseInt(minBattery));
    
    res.json({
      success: true,
      data: {
        drones
      }
    });
    
  } catch (error) {
    logger.error('Get available drones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available drones'
    });
  }
};

// Get drone statistics
const getDroneStatistics = async (req, res) => {
  try {
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
    
    const totalDrones = await Drone.countDocuments({ restaurantId });
    const availableDrones = await Drone.countDocuments({ 
      restaurantId, 
      status: 'IDLE',
      batteryLevel: { $gte: 30 }
    });
    const inFlightDrones = await Drone.countDocuments({ 
      restaurantId, 
      status: 'IN_FLIGHT' 
    });
    const maintenanceDrones = await Drone.countDocuments({ 
      restaurantId, 
      status: 'MAINTENANCE' 
    });
    
    const stats = {
      totalDrones,
      availableDrones,
      inFlightDrones,
      maintenanceDrones,
      utilizationRate: totalDrones > 0 ? Math.round((inFlightDrones / totalDrones) * 100) : 0
    };
    
    res.json({
      success: true,
      data: {
        statistics: stats
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

module.exports = {
  getRestaurantDrones,
  getDroneById,
  createDrone,
  updateDrone,
  updateDroneStatus,
  updateDroneLocation,
  scheduleMaintenance,
  getAvailableDrones,
  getDroneStatistics
};
