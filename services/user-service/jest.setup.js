// Jest setup file for user-service
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test_user_service';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.CLIENT_URL = 'http://localhost:5173';

