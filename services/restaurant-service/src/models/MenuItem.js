const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
menuItemSchema.index({ restaurantId: 1, available: 1 });
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, featured: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ price: 1 });

// Virtual for discount percentage
menuItemSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for stock status
menuItemSchema.virtual('stockStatus').get(function() {
  // Inventory removed; assume available
  return this.available ? 'available' : 'out_of_stock';
});

// Instance method to check availability
menuItemSchema.methods.isAvailable = function() {
  return !!this.available;
};

// Instance method to update stock
// Inventory/ratings removed; provide no-op updateStock/reserveStock/updateRating for compatibility
menuItemSchema.methods.updateStock = function(quantity) {
  // No inventory tracking — pretend success
  return Promise.resolve(this);
};

menuItemSchema.methods.reserveStock = function(quantity) {
  // No inventory tracking — pretend success
  return Promise.resolve(this);
};

menuItemSchema.methods.updateRating = function(newRating) {
  // Ratings removed — no-op for compatibility
  return Promise.resolve(this);
};

// Static method to find by restaurant
menuItemSchema.statics.findByRestaurant = function(restaurantId, options = {}) {
  const query = { restaurantId, available: true };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.featured) {
    query.featured = options.featured;
  }
  
  if (options.minPrice || options.maxPrice) {
    query.price = {};
    if (options.minPrice) query.price.$gte = options.minPrice;
    if (options.maxPrice) query.price.$lte = options.maxPrice;
  }
  
  return this.find(query).sort({ featured: -1, name: 1 });
};

// Static method to find popular items
menuItemSchema.statics.findPopular = function(restaurantId, limit = 10) {
  // Popularity removed; return latest featured items as a fallback
  return this.find({ restaurantId, available: true })
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to search menu items
menuItemSchema.statics.search = function(searchTerm, options = {}) {
  const query = { available: true };

  if (searchTerm) {
    // Use simple regex search across name/description/category for compatibility
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: regex },
      { description: regex },
      { category: regex }
    ];
  }

  if (options.restaurantId) {
    query.restaurantId = options.restaurantId;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.minPrice || options.maxPrice) {
    query.price = {};
    if (options.minPrice) query.price.$gte = options.minPrice;
    if (options.maxPrice) query.price.$lte = options.maxPrice;
  }

  return this.find(query).sort({ featured: -1, name: 1 });
};

module.exports = mongoose.model('MenuItem', menuItemSchema);
