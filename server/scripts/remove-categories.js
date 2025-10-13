const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ffdd';

// MenuItem schema (simple version for deletion)
const menuItemSchema = new mongoose.Schema({
  restaurantId: mongoose.Schema.Types.ObjectId,
  name: String,
  category: String,
  // ... other fields
}, { collection: 'menuitems' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

async function removeCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find items with these categories
    const categoriesToRemove = ['Món Á', 'Ăn Kiêng', 'asian', 'healthy'];
    
    const itemsToDelete = await MenuItem.find({
      category: { $in: categoriesToRemove }
    });

    console.log(`\n📊 Found ${itemsToDelete.length} items to delete:`);
    itemsToDelete.forEach(item => {
      console.log(`  - ${item.name} (${item.category})`);
    });

    // Delete the items
    const result = await MenuItem.deleteMany({
      category: { $in: categoriesToRemove }
    });

    console.log(`\n✅ Deleted ${result.deletedCount} menu items`);
    console.log('✨ Categories "Món Á" and "Ăn Kiêng" have been removed from the database');

    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
removeCategories();

