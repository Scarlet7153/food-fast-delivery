require('dotenv').config();

const config = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  
  // Service URLs
  USER_SERVICE_URL: process.env.USER_SERVICE_URL,
  RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL,
  DRONE_SERVICE_URL: process.env.DRONE_SERVICE_URL,
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  
  // Business Configuration
  DELIVERY_BASE_RATE: parseInt(process.env.DELIVERY_BASE_RATE),
  DELIVERY_RATE_PER_KM: parseInt(process.env.DELIVERY_RATE_PER_KM)
};

module.exports = config;
