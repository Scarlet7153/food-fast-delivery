const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const missionController = require('../controllers/mission.controller');

// Restaurant owner routes (protected)
router.post('/', auth, requireRole('restaurant'), validate(schemas.mission), missionController.createMission);
router.get('/', auth, requireRole('restaurant'), missionController.getMissions);
router.get('/:id', auth, requireRole('restaurant'), missionController.getMission);
router.patch('/:id/status', auth, requireRole('restaurant'), missionController.updateMissionStatus);
router.patch('/:id/path', auth, requireRole('restaurant'), missionController.updateMissionPath);
router.patch('/:id/abort', auth, requireRole('restaurant'), missionController.abortMission);
router.patch('/:id/complete', auth, requireRole('restaurant'), missionController.completeMission);

// Admin routes
router.get('/admin/all', auth, requireRole('admin'), missionController.getAllMissions);
router.get('/admin/statistics', auth, requireRole('admin'), missionController.getMissionStatistics);

module.exports = router;
