// Jest setup file for user-service
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test_user_service';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.JWT_RESET_EXPIRES_IN = process.env.JWT_RESET_EXPIRES_IN || '1h';
process.env.CLIENT_URL = 'http://localhost:5173';

