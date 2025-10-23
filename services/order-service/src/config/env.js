require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3004,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffdd_orders',
  
  // Service URLs
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003',
  DRONE_SERVICE_URL: process.env.DRONE_SERVICE_URL || 'http://localhost:3005',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Socket.IO
  SOCKET_PORT: process.env.SOCKET_PORT || 3004
};

module.exports = config;
