/**
 * Seed script to create initial test users for microservices
 * Run with: node scripts/seed-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const config = require('../src/config/env');

const testUsers = [
  {
    email: 'admin@ffdd.com',
    password: 'admin123',
    name: 'Admin User',
    phone: '0901234567',
    role: 'admin',
    active: true
  },
  {
    email: 'customer@ffdd.com',
    password: 'customer123',
    name: 'Test Customer',
    phone: '0902234567',
    role: 'customer',
    active: true,
    address: {
      text: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      location: {
        type: 'Point',
        coordinates: [106.7008, 10.7756] // Nguyen Hue Walking Street
      }
    }
  },
  {
    email: 'customer2@ffdd.com',
    password: 'customer123',
    name: 'Another Customer',
    phone: '0903234567',
    role: 'customer',
    active: true,
    address: {
      text: '456 Le Loi, District 1, Ho Chi Minh City',
      location: {
        type: 'Point',
        coordinates: [106.6954, 10.7765]
      }
    }
  }
];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n--- Seeding Users ---');
    
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n--- Seed Complete ---');
    console.log('\nTest Accounts:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ Admin:                                  │');
    console.log('│   Email: admin@ffdd.com                 │');
    console.log('│   Password: admin123                    │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Customer 1:                             │');
    console.log('│   Email: customer@ffdd.com              │');
    console.log('│   Password: customer123                 │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Customer 2:                             │');
    console.log('│   Email: customer2@ffdd.com             │');
    console.log('│   Password: customer123                 │');
    console.log('└─────────────────────────────────────────┘');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run seed
seedUsers();
