const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connect = async () => {
  // Better defaults for Atlas + SRV DNS environments and transient network issues.
  const options = {
    maxPoolSize: 10,
    // Increase server selection timeout to allow DNS/SRV resolution and transient network hiccups
    serverSelectionTimeoutMS: 30000,
    // Keep socket timeout reasonably high for long-running operations
    socketTimeoutMS: 45000,
    bufferCommands: false,
    // Recommended modern parser and topology
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Force IPv4 in case IPv6 DNS resolution causes issues in some environments
    family: 4,
  };

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt += 1;
      await mongoose.connect(config.MONGODB_URI, options);
      logger.info('Connected to MongoDB - User Service');
      return;
    } catch (error) {
      logger.error(`MongoDB connection error (attempt ${attempt}):`, error);
      if (attempt >= maxRetries) {
        // All retries exhausted — rethrow so calling code can handle shutdown
        throw error;
      }
      // Exponential backoff before retrying
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB - User Service');
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
