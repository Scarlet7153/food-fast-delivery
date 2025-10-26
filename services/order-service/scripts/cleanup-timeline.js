const mongoose = require('mongoose');
const Order = require('../src/models/Order');
require('dotenv').config();

async function cleanupTimelineDuplicates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all orders with timeline
    const orders = await Order.find({ timeline: { $exists: true, $ne: [] } });
    console.log(`Found ${orders.length} orders with timeline entries`);

    let cleanedCount = 0;

    for (const order of orders) {
      const originalLength = order.timeline.length;
      
      // Clean up duplicates
      order.cleanupTimeline();
      
      if (order.timeline.length !== originalLength) {
        await order.save();
        cleanedCount++;
        console.log(`Cleaned order ${order.orderNumber}: ${originalLength} -> ${order.timeline.length} entries`);
      }
    }

    console.log(`\nCleanup completed!`);
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Orders cleaned: ${cleanedCount}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupTimelineDuplicates();
