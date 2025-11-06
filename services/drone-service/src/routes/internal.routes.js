  const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');

// Internal routes for service-to-service communication
// These routes should NOT be exposed through API Gateway

/**
 * Get mission by ID (internal)
 * Used by Order Service to fetch drone info
 */
router.get('/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mission = await DeliveryMission.findById(id)
      .populate('droneId', 'name model status');
    
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
    logger.error('[INTERNAL] Get mission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get mission'
    });
  }
});

/**
 * Update drone status (internal)
 * Used by Order Service when delivery is confirmed
 */
router.patch('/drones/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['IDLE', 'BUSY'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const drone = await Drone.findById(id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Update status
    await drone.updateStatus(status);
    
    logger.info(`[INTERNAL] Drone ${drone.name} status updated to ${status}`);
    
    res.json({
      success: true,
      message: 'Drone status updated successfully',
      data: {
        drone: {
          _id: drone._id,
          name: drone.name,
          status: drone.status
        }
      }
    });
    
  } catch (error) {
    logger.error('[INTERNAL] Update drone status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update drone status'
    });
  }
});

/**
 * Update mission status (internal)
 * Used by Order Service
 */
router.patch('/missions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const mission = await DeliveryMission.findById(id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Update mission status
    mission.status = status;
    if (status === 'COMPLETED') {
      mission.completedAt = new Date();
      
      // Update drone status to IDLE when mission completed
      const drone = await Drone.findById(mission.droneId);
      if (drone) {
        drone.status = 'IDLE';
        drone.currentMission = undefined;
        await drone.save();
        logger.info(`[INTERNAL] Drone ${drone.name} status updated to IDLE after mission completion`);
      }
    }
    await mission.save();
    
    logger.info(`[INTERNAL] Mission ${mission.missionNumber} status updated to ${status}`);
    
    res.json({
      success: true,
      message: 'Mission status updated successfully',
      data: {
        mission
      }
    });
    
  } catch (error) {
    logger.error('[INTERNAL] Update mission status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update mission status'
    });
  }
});

/**
 * Create mission (internal)
 * Used by Order Service when assigning drone
 */
router.post('/missions', async (req, res) => {
  try {
    const { orderId, droneId, restaurantId, deliveryAddress, payloadWeight } = req.body;
    
    // Verify drone exists
    const drone = await Drone.findById(droneId);
    if (!drone) {
      return res.status(404).json({
        success: false,
        error: 'Drone not found'
      });
    }
    
    // Generate mission number manually (workaround)
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last mission of the day
    const lastMission = await DeliveryMission.findOne({
      missionNumber: new RegExp(`^MSN${year}${month}${day}`)
    }).sort({ missionNumber: -1 });
    
    let sequence = 1;
    if (lastMission) {
      const lastSequence = parseInt(lastMission.missionNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    const missionNumber = `MSN${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    
    logger.info('[INTERNAL] Creating mission with data:', { orderId, droneId, missionNumber });
    
    const mission = new DeliveryMission({
      orderId,
      droneId,
      restaurantId,
      missionNumber,
      status: 'PENDING'
    });
    
    await mission.save();
    
    logger.info(`[INTERNAL] Mission ${mission.missionNumber} created for order ${orderId}`);
    
    res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      data: {
        mission: {
          _id: mission._id,
          orderId: mission.orderId,
          droneId: mission.droneId,
          restaurantId: mission.restaurantId,
          missionNumber: mission.missionNumber,
          status: mission.status
        }
      }
    });
    
  } catch (error) {
    logger.error('[INTERNAL] Create mission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create mission'
    });
  }
});

module.exports = router;
