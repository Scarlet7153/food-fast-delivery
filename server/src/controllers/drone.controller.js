const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');

// Create drone
const createDrone = async (req, res) => {
  try {
    const { name, serial, model, payloadMaxGrams, rangeKm, speedKmh, geofence } = req.body;

    // Check if user has a restaurant
    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to create drones'
      });
    }

    // Check if serial number is unique
    const existingDrone = await Drone.findOne({ serial });
    if (existingDrone) {
      return res.status(400).json({
        success: false,
        error: 'Drone with this serial number already exists'
      });
    }

    const drone = new Drone({
      restaurantId: req.user.restaurantId,
      name,
      serial,
      model,
      payloadMaxGrams,
      rangeKm,
      speedKmh,
      geofence,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default location, needs to be updated
      }
    });

    await drone.save();

    logger.info(`Drone created: ${drone.name} (${drone.serial}) for restaurant ${req.user.restaurantId}`);

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

// Get drones
const getDrones = async (req, res) => {
  try {
    const { status, available, page = 1, limit = 20 } = req.query;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view drones'
      });
    }

    const query = { restaurantId: req.user.restaurantId };
    
    if (status) query.status = status;
    if (available === 'true') {
      query.status = 'IDLE';
      query.batteryPercent = { $gte: 30 };
      query['maintenance.healthStatus'] = { $ne: 'CRITICAL' };
    }

    const drones = await Drone.find(query)
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
    logger.error('Get drones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drones'
    });
  }
};

// Get single drone
const getDrone = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view drones'
      });
    }

    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    }).populate('currentMission');

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Get recent missions for this drone
    const recentMissions = await DeliveryMission.find({
      droneId: drone._id
    })
    .populate('orderId', 'orderNumber amount')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        drone,
        recentMissions
      }
    });

  } catch (error) {
    logger.error('Get drone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drone'
    });
  }
};

// Update drone
const updateDrone = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update drones'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Check if serial number is unique (if being updated)
    if (updateData.serial && updateData.serial !== drone.serial) {
      const existingDrone = await Drone.findOne({ 
        serial: updateData.serial,
        _id: { $ne: id }
      });
      if (existingDrone) {
        return res.status(400).json({
          success: false,
          error: 'Drone with this serial number already exists'
        });
      }
    }

    const updatedDrone = await Drone.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Drone updated: ${updatedDrone.name} (${updatedDrone.serial})`);

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

// Delete drone
const deleteDrone = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to delete drones'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Check if drone is currently in use
    if (drone.status === 'IN_FLIGHT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete drone while it is in flight'
      });
    }

    // Check if drone has active missions
    const activeMission = await DeliveryMission.findOne({
      droneId: drone._id,
      status: { $in: ['QUEUED', 'PREPARING', 'TAKEOFF', 'CRUISING', 'APPROACHING', 'LANDING'] }
    });

    if (activeMission) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete drone with active missions'
      });
    }

    await Drone.findByIdAndDelete(id);

    logger.info(`Drone deleted: ${drone.name} (${drone.serial})`);

    res.json({
      success: true,
      message: 'Drone deleted successfully'
    });

  } catch (error) {
    logger.error('Delete drone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete drone'
    });
  }
};

// Update drone status
const updateDroneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update drone status'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    await drone.updateStatus(status);

    logger.info(`Drone status updated: ${drone.name} - ${status}`);

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
    const { longitude, latitude, altitude = 0, heading = 0 } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update drone location'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    // Check if location is within geofence
    if (!drone.isWithinGeofence(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Location is outside drone geofence'
      });
    }

    await drone.updateLocation(longitude, latitude, altitude, heading);

    logger.info(`Drone location updated: ${drone.name} - ${latitude}, ${longitude}`);

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

// Update drone battery
const updateDroneBattery = async (req, res) => {
  try {
    const { id } = req.params;
    const { batteryPercent } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to update drone battery'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    await drone.updateBattery(batteryPercent);

    logger.info(`Drone battery updated: ${drone.name} - ${batteryPercent}%`);

    res.json({
      success: true,
      message: 'Drone battery updated successfully',
      data: {
        drone
      }
    });

  } catch (error) {
    logger.error('Update drone battery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drone battery'
    });
  }
};

// Schedule maintenance
const scheduleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { daysFromNow = 30 } = req.body;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to schedule maintenance'
      });
    }

    // Check if drone belongs to user's restaurant
    const drone = await Drone.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }

    await drone.scheduleMaintenance(daysFromNow);

    logger.info(`Maintenance scheduled for drone: ${drone.name} in ${daysFromNow} days`);

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

// Get all drones (admin)
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
      query['maintenance.nextMaintenance'] = { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }; // Due in 3 days
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

// Get drone statistics (admin)
const getDroneStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    // Get drone statistics
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
          maintenanceDrones: {
            $sum: { $cond: [{ $eq: ['$status', 'MAINTENANCE'] }, 1, 0] }
          },
          averageBattery: { $avg: '$batteryPercent' },
          averageFlightHours: { $avg: '$maintenance.totalFlightHours' }
        }
      }
    ]);

    // Get mission statistics
    const missionStats = await DeliveryMission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMissions: { $sum: 1 },
          completedMissions: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          failedMissions: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
          },
          averageDuration: { $avg: '$actuals.durationMinutes' },
          averageDistance: { $avg: '$actuals.distanceKm' }
        }
      }
    ]);

    // Get status breakdown
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
          maintenanceDrones: 0,
          averageBattery: 0,
          averageFlightHours: 0
        },
        missionStatistics: missionStats[0] || {
          totalMissions: 0,
          completedMissions: 0,
          failedMissions: 0,
          averageDuration: 0,
          averageDistance: 0
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

module.exports = {
  createDrone,
  getDrones,
  getDrone,
  updateDrone,
  deleteDrone,
  updateDroneStatus,
  updateDroneLocation,
  updateDroneBattery,
  scheduleMaintenance,
  getAllDrones,
  getDroneStatistics
};
