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
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  
  // MoMo Payment Gateway
  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
  MOMO_ENDPOINT_CREATE: process.env.MOMO_ENDPOINT_CREATE,
  MOMO_IPN_URL: process.env.MOMO_IPN_URL,
  MOMO_RETURN_URL: process.env.MOMO_RETURN_URL
};

module.exports = config;
