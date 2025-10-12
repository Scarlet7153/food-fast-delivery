const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const droneController = require('../controllers/drone.controller');

// Restaurant owner routes (protected)
router.post('/', auth, requireRole('restaurant'), validate(schemas.drone), droneController.createDrone);
router.get('/', auth, requireRole('restaurant'), droneController.getDrones);
router.get('/:id', auth, requireRole('restaurant'), droneController.getDrone);
router.put('/:id', auth, requireRole('restaurant'), droneController.updateDrone);
router.delete('/:id', auth, requireRole('restaurant'), droneController.deleteDrone);
router.patch('/:id/status', auth, requireRole('restaurant'), droneController.updateDroneStatus);
router.patch('/:id/location', auth, requireRole('restaurant'), droneController.updateDroneLocation);
router.patch('/:id/battery', auth, requireRole('restaurant'), droneController.updateDroneBattery);
router.patch('/:id/maintenance', auth, requireRole('restaurant'), droneController.scheduleMaintenance);

// Admin routes
router.get('/admin/all', auth, requireRole('admin'), droneController.getAllDrones);
router.get('/admin/statistics', auth, requireRole('admin'), droneController.getDroneStatistics);

module.exports = router;

