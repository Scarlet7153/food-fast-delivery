const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const droneController = require('../controllers/drone.controller');
const missionController = require('../controllers/mission.controller');
const simulationController = require('../controllers/simulation.controller');

// Mission routes - MUST BE FIRST to avoid conflicts with /:id
router.get('/missions', auth, requireRole('restaurant'), missionController.getRestaurantMissions);
router.get('/missions/statistics', auth, requireRole('restaurant'), missionController.getMissionStatistics);
router.get('/missions/:id', auth, requireRole('restaurant'), missionController.getMissionById);
router.post('/missions', auth, requireRole('restaurant'), validate(schemas.createMission), missionController.createMission);
router.patch('/missions/:id/status', auth, requireRole('restaurant'), validate(schemas.updateMissionStatus), missionController.updateMissionStatus);
router.post('/missions/:id/path', auth, requireRole('restaurant'), validate(schemas.addPathPoint), missionController.addPathPoint);

// Simulation routes
router.post('/missions/:id/simulate', auth, requireRole('restaurant'), simulationController.startFlightSimulation);
router.post('/missions/:id/stop-simulation', auth, requireRole('restaurant'), simulationController.stopFlightSimulation);
router.get('/simulations/active', auth, requireRole('restaurant'), simulationController.getActiveSimulations);

// Drone routes - Specific routes BEFORE /:id
router.get('/', auth, requireRole('restaurant'), droneController.getRestaurantDrones);
router.get('/available', auth, requireRole('restaurant'), droneController.getAvailableDrones);
router.get('/statistics', auth, requireRole('restaurant'), droneController.getDroneStatistics);
router.get('/:id', auth, requireRole('restaurant'), droneController.getDroneById);
router.post('/', auth, requireRole('restaurant'), validate(schemas.createDrone), droneController.createDrone);
router.put('/:id', auth, requireRole('restaurant'), validate(schemas.updateDrone), droneController.updateDrone);
router.patch('/:id/status', auth, requireRole('restaurant'), validate(schemas.updateDroneStatus), droneController.updateDroneStatus);
router.patch('/:id/location', auth, requireRole('restaurant'), validate(schemas.updateDroneLocation), droneController.updateDroneLocation);
// Allow restaurant owners to delete their drone
router.delete('/:id', auth, requireRole('restaurant'), droneController.deleteDrone);

module.exports = router;
