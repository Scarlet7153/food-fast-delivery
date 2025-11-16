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
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL,
  DRONE_SERVICE_URL: process.env.DRONE_SERVICE_URL,
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE),
  UPLOAD_PATH: process.env.UPLOAD_PATH
};

module.exports = config;
