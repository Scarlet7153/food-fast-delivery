const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connect = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // Increase timeout
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
      // Add retry logic
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 2000,
    };

    // Try to connect with retries
    let retries = 5;
    while (retries > 0) {
      try {
        await mongoose.connect(config.MONGODB_URI, options);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        logger.warn(`Failed to connect to MongoDB. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
    
    logger.info('Connected to MongoDB - Order Service');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB - Order Service');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = {
  connect,
  disconnect
};
