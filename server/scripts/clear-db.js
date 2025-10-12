const mongoose = require('mongoose');
const config = require('../src/config/env');
const database = require('../src/config/database');

// Import models
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const Drone = require('../src/models/Drone');
const DeliveryMission = require('../src/models/DeliveryMission');

const logger = require('../src/utils/logger');

async function clearDatabase() {
  try {
    logger.info('Starting database clearing...');

    // Connect to database
    await database.connect();

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      Drone.deleteMany({}),
      DeliveryMission.deleteMany({})
    ]);

    logger.info('Database cleared successfully!');
    console.log('\n=== DATABASE CLEARED ===');
    console.log('All data has been removed from the database.');
    console.log('You can now create users manually through the registration API.');

  } catch (error) {
    logger.error('Database clearing failed:', error);
    throw error;
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run clearing
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;
