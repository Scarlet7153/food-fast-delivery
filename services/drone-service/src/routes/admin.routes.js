const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const droneController = require('../controllers/drone.controller');
const missionController = require('../controllers/mission.controller');
const adminController = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(auth, requireRole('admin'));

// Drone management
router.get('/drones', adminController.getAllDrones);
router.get('/drones/:id', adminController.getDroneById);
router.patch('/drones/:id/status', adminController.updateDroneStatus);

// Mission management
router.get('/missions', missionController.getAllMissions);
router.get('/missions/:id', missionController.getMissionById);
router.patch('/missions/:id/status', missionController.updateMissionStatus);

// Statistics endpoints
router.get('/statistics', adminController.getStatistics);
router.get('/overview', adminController.getOverview);

module.exports = router;
