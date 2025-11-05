const DeliveryMission = require('../models/DeliveryMission');
const Drone = require('../models/Drone');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Active simulations storage
const activeSimulations = new Map();

/**
 * Start drone flight simulation for a mission
 */
const startFlightSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mission = await DeliveryMission.findById(id)
      .populate('droneId');
    
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Check if simulation is already running
    if (activeSimulations.has(mission._id.toString())) {
      return res.status(400).json({
        success: false,
        error: 'Simulation already running for this mission'
      });
    }
    
    // Update mission status to IN_PROGRESS
    if (mission.status === 'PENDING' || mission.status === 'ASSIGNED') {
      await mission.updateStatus('IN_PROGRESS', 'Flight simulation started');
    }
    
    // Start the simulation
    simulateDroneFlight(mission, req.app.get('io'));
    
    res.json({
      success: true,
      message: 'Drone flight simulation started',
      data: {
        missionId: mission._id,
        missionNumber: mission.missionNumber,
        status: mission.status
      }
    });
    
  } catch (error) {
    logger.error('Start flight simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start flight simulation'
    });
  }
};

/**
 * Stop drone flight simulation
 */
const stopFlightSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!activeSimulations.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'No active simulation found for this mission'
      });
    }
    
    const simulation = activeSimulations.get(id);
    clearInterval(simulation.intervalId);
    activeSimulations.delete(id);
    
    res.json({
      success: true,
      message: 'Flight simulation stopped'
    });
    
  } catch (error) {
    logger.error('Stop flight simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop flight simulation'
    });
  }
};

/**
 * Get active simulations
 */
const getActiveSimulations = async (req, res) => {
  try {
    const simulations = Array.from(activeSimulations.keys());
    
    res.json({
      success: true,
      data: {
        activeSimulations: simulations,
        count: simulations.length
      }
    });
    
  } catch (error) {
    logger.error('Get active simulations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active simulations'
    });
  }
};

/**
 * Simulate drone flight from pickup to delivery
 */
async function simulateDroneFlight(mission, io) {
  const missionId = mission._id.toString();
  
  // Get pickup and delivery coordinates
  const pickupCoords = mission.route.pickup.location.coordinates; // [lng, lat]
  const deliveryCoords = mission.route.delivery.location.coordinates; // [lng, lat]
  
  // Calculate total distance and number of steps
  const totalSteps = 50; // Number of position updates during flight
  const stepDelayMs = 2000; // 2 seconds between each update
  
  let currentStep = 0;
  const drone = mission.droneId;
  let currentBattery = drone.batteryLevel || 100;
  const batteryConsumptionPerStep = (mission.estimates.batteryConsumption || 20) / totalSteps;
  
  logger.info(`Starting flight simulation for mission ${mission.missionNumber}`);
  
  // Create simulation data
  const simulation = {
    missionId,
    intervalId: null,
    startTime: new Date(),
    totalSteps,
    currentStep: 0
  };
  
  // Simulation interval
  simulation.intervalId = setInterval(async () => {
    try {
      currentStep++;
      simulation.currentStep = currentStep;
      
      // Calculate interpolated position (linear interpolation)
      const progress = currentStep / totalSteps;
      const currentLng = pickupCoords[0] + (deliveryCoords[0] - pickupCoords[0]) * progress;
      const currentLat = pickupCoords[1] + (deliveryCoords[1] - pickupCoords[1]) * progress;
      
      // Simulate altitude (climb to 100m, then descend)
      let altitude = 0;
      if (progress < 0.2) {
        // Climbing phase (0-20%)
        altitude = (progress / 0.2) * 100;
      } else if (progress > 0.8) {
        // Descending phase (80-100%)
        altitude = ((1 - progress) / 0.2) * 100;
      } else {
        // Cruising phase
        altitude = 100;
      }
      
      // Calculate heading (direction to delivery point)
      const heading = calculateHeading(currentLat, currentLng, deliveryCoords[1], deliveryCoords[0]);
      
      // Simulate speed (km/h)
      const speed = progress < 0.1 || progress > 0.9 ? 20 : 40; // Slower at start/end
      
      // Update battery
      currentBattery = Math.max(0, currentBattery - batteryConsumptionPerStep);
      
      // Add path point to mission
      const updatedMission = await DeliveryMission.findById(missionId);
      if (updatedMission) {
        await updatedMission.addPathPoint(
          currentLat,
          currentLng,
          Math.round(altitude),
          Math.round(heading),
          Math.round(speed),
          Math.round(currentBattery)
        );
        
        // Update drone location and battery
        const droneDoc = await Drone.findById(updatedMission.droneId);
        if (droneDoc) {
          droneDoc.currentLocation = {
            lat: currentLat,
            lng: currentLng,
            timestamp: new Date()
          };
          droneDoc.batteryLevel = Math.round(currentBattery);
          await droneDoc.save();
        }
        
        // Emit real-time update via Socket.IO
        if (io) {
          io.to(`restaurant-${updatedMission.restaurantId}`).emit('mission-location-update', {
            missionId: updatedMission._id,
            missionNumber: updatedMission.missionNumber,
            location: {
              latitude: currentLat,
              longitude: currentLng,
              altitude: Math.round(altitude)
            },
            heading: Math.round(heading),
            speed: Math.round(speed),
            batteryPercent: Math.round(currentBattery),
            progress: Math.round(progress * 100),
            timestamp: new Date()
          });
        }
        
        logger.info(`Flight update: Mission ${updatedMission.missionNumber} - Step ${currentStep}/${totalSteps} (${Math.round(progress * 100)}%)`);
      }
      
      // Check if flight is complete
      if (currentStep >= totalSteps) {
        clearInterval(simulation.intervalId);
        activeSimulations.delete(missionId);
        
        // Update mission status to DELIVERED
        const finalMission = await DeliveryMission.findById(missionId);
        if (finalMission) {
          await finalMission.updateStatus('DELIVERED', 'Package delivered successfully');
          
          // Calculate actual values
          finalMission.actual.distanceKm = finalMission.estimates.distanceKm;
          finalMission.actual.batteryUsed = Math.round(mission.estimates.batteryConsumption || 20);
          await finalMission.save();
          
          // Update drone status back to IDLE
          const droneDoc = await Drone.findById(finalMission.droneId);
          if (droneDoc) {
            droneDoc.status = 'IDLE';
            droneDoc.currentMission = undefined;
            droneDoc.maintenance.totalFlights = (droneDoc.maintenance.totalFlights || 0) + 1;
            droneDoc.maintenance.totalFlightHours = (droneDoc.maintenance.totalFlightHours || 0) + 
              (finalMission.actual.durationMinutes || 30) / 60;
            await droneDoc.save();
          }
          
          // Emit completion event
          if (io) {
            io.to(`restaurant-${finalMission.restaurantId}`).emit('mission-completed', {
              missionId: finalMission._id,
              missionNumber: finalMission.missionNumber,
              status: 'DELIVERED',
              timestamp: new Date()
            });
          }
          
          // Update order status
          try {
            await axios.patch(`${config.ORDER_SERVICE_URL}/api/orders/${finalMission.orderId}/status`, {
              status: 'DELIVERED',
              note: 'Package delivered by drone'
            });
          } catch (error) {
            logger.warn('Failed to update order status:', error.message);
          }
          
          logger.info(`Flight simulation completed for mission ${finalMission.missionNumber}`);
        }
      }
      
    } catch (error) {
      logger.error('Flight simulation step error:', error);
      clearInterval(simulation.intervalId);
      activeSimulations.delete(missionId);
    }
  }, stepDelayMs);
  
  // Store active simulation
  activeSimulations.set(missionId, simulation);
}

/**
 * Calculate heading (bearing) between two coordinates
 */
function calculateHeading(lat1, lon1, lat2, lon2) {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  const heading = toDegrees(Math.atan2(y, x));
  return (heading + 360) % 360; // Normalize to 0-360
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Auto-start simulation when mission is created or assigned
 */
const autoStartSimulation = async (missionId, io) => {
  try {
    const mission = await DeliveryMission.findById(missionId)
      .populate('droneId');
    
    if (mission && !activeSimulations.has(missionId.toString())) {
      // Wait a few seconds before starting
      setTimeout(() => {
        simulateDroneFlight(mission, io);
      }, 3000);
    }
  } catch (error) {
    logger.error('Auto-start simulation error:', error);
  }
};

module.exports = {
  startFlightSimulation,
  stopFlightSimulation,
  getActiveSimulations,
  autoStartSimulation
};
