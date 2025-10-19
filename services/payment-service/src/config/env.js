require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3006,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ffdd_payments',
  
  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // MoMo Payment Gateway
  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
  MOMO_ENDPOINT: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_RETURN_URL: process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/return',
  MOMO_NOTIFY_URL: process.env.MOMO_NOTIFY_URL || 'http://localhost:3006/api/payments/momo/notify',
  MOMO_IPN_URL: process.env.MOMO_IPN_URL || 'http://localhost:3006/api/payments/momo/ipn',
  
  // Payment Settings
  PAYMENT_TIMEOUT_MINUTES: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 15,
  REFUND_TIMEOUT_DAYS: parseInt(process.env.REFUND_TIMEOUT_DAYS) || 7
};

module.exports = config;
