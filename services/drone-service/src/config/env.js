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
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL,
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  
  // Drone Configuration
  DRONE_MAX_BATTERY: parseInt(process.env.DRONE_MAX_BATTERY),
  DRONE_MIN_BATTERY_FOR_MISSION: parseInt(process.env.DRONE_MIN_BATTERY_FOR_MISSION),
  DRONE_DEFAULT_SPEED_KMH: parseInt(process.env.DRONE_DEFAULT_SPEED_KMH),
  DRONE_DEFAULT_RANGE_KM: parseInt(process.env.DRONE_DEFAULT_RANGE_KM)
};

module.exports = config;
