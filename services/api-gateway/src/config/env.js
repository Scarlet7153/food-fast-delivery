require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003',
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  DRONE_SERVICE_URL: process.env.DRONE_SERVICE_URL || 'http://localhost:3005',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

module.exports = config;
