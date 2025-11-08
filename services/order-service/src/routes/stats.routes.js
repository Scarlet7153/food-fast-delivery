const express = require('express');
const router = express.Router();
const { getRestaurantStats } = require('../controllers/stats.controller');
const { auth, requireRole } = require('../middlewares/auth');

// Use auth middleware and role check (requireRole) exported from auth.js
router.get('/restaurant/stats', auth, requireRole('restaurant'), getRestaurantStats);

module.exports = router;