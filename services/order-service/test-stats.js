const express = require('express');
const cors = require('cors');
const { auth, requireRole } = require('./src/middlewares/auth');
const { getRestaurantStats } = require('./src/controllers/stats.controller');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
res.json({ message: 'Stats service test OK' });
});

// Stats route
app.get('/orders/restaurant/stats', auth, requireRole('restaurant'), getRestaurantStats);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
console.log(`Stats test server running on port ${PORT}`);
});