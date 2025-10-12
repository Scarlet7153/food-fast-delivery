const dotenv = require('dotenv');

dotenv.config();

const config = {
  // Server
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ffdd',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // MoMo Payment
  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
  MOMO_ENDPOINT_CREATE: process.env.MOMO_ENDPOINT_CREATE || 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_IPN_URL: process.env.MOMO_IPN_URL || 'http://localhost:4000/api/payments/momo/ipn',
  MOMO_RETURN_URL: process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/result',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
  
  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Business Rules
  DELIVERY_BASE_RATE: 10000, // 10,000 VND base delivery fee
  DELIVERY_RATE_PER_KM: 5000, // 5,000 VND per km
  
  // Drone Settings
  DRONE_MAX_BATTERY: 100,
  DRONE_MIN_BATTERY_FOR_MISSION: 30,
  DRONE_DEFAULT_SPEED_KMH: 50,
  DRONE_DEFAULT_RANGE_KM: 10
};

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}

module.exports = config;

