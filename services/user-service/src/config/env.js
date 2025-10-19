require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffdd_users',
  
  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

module.exports = config;
