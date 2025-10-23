require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3005,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffdd_drones',
  
  // Service URLs
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003',
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Socket.IO
  SOCKET_PORT: process.env.SOCKET_PORT || 3005,
  
  // Drone Configuration
  DRONE_MAX_CAPACITY: parseInt(process.env.DRONE_MAX_CAPACITY) || 5,
  DRONE_MAX_DISTANCE: parseInt(process.env.DRONE_MAX_DISTANCE) || 10,
  DRONE_BATTERY_WARNING: parseInt(process.env.DRONE_BATTERY_WARNING) || 20,
  DRONE_BATTERY_CRITICAL: parseInt(process.env.DRONE_BATTERY_CRITICAL) || 10
};

module.exports = config;
