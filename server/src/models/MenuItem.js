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
  images: [{
    url: String,
    alt: String
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
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
  weightGrams: {
    type: Number,
    min: [1, 'Weight must be at least 1 gram'],
    max: [5000, 'Weight cannot exceed 5000 grams']
  },
  // Nutritional information (optional)
  nutrition: {
    calories: Number,
    protein: Number, // grams
    carbs: Number, // grams
    fat: Number, // grams
    fiber: Number, // grams
    sodium: Number // mg
  },
  // Allergens and dietary info
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'sesame']
  }],
  dietary: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'keto', 'low-carb', 'dairy-free', 'gluten-free']
  }],
  // Preparation time
  prepTimeMinutes: {
    type: Number,
    default: 10,
    min: [1, 'Prep time must be at least 1 minute'],
    max: [120, 'Prep time cannot exceed 120 minutes']
  },
  // Popularity tracking
  popularity: {
    orderCount: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  // Inventory tracking
  inventory: {
    trackInventory: {
      type: Boolean,
      default: false
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    outOfStock: {
      type: Boolean,
      default: false
    }
  },
  // SEO and search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  searchKeywords: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
menuItemSchema.index({ restaurantId: 1, available: 1 });
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, featured: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ 'popularity.rating.average': -1 });

// Virtual for restaurant info
menuItemSchema.virtual('restaurant', {
  ref: 'Restaurant',
  localField: 'restaurantId',
  foreignField: '_id',
  justOne: true
});

// Virtual for discount percentage
menuItemSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for stock status
menuItemSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackInventory) {
    return 'available';
  }
  
  if (this.inventory.outOfStock || this.inventory.stockQuantity === 0) {
    return 'out_of_stock';
  }
  
  if (this.inventory.stockQuantity <= this.inventory.lowStockThreshold) {
    return 'low_stock';
  }
  
  return 'in_stock';
});

// Instance method to check availability
menuItemSchema.methods.isAvailable = function() {
  if (!this.available) return false;
  
  if (this.inventory.trackInventory) {
    return !this.inventory.outOfStock && this.inventory.stockQuantity > 0;
  }
  
  return true;
};

// Instance method to update stock
menuItemSchema.methods.updateStock = function(quantity) {
  if (!this.inventory.trackInventory) {
    throw new Error('Inventory tracking is not enabled for this item');
  }
  
  this.inventory.stockQuantity = Math.max(0, this.inventory.stockQuantity + quantity);
  this.inventory.outOfStock = this.inventory.stockQuantity === 0;
  
  return this.save();
};

// Instance method to reserve stock
menuItemSchema.methods.reserveStock = function(quantity) {
  if (!this.inventory.trackInventory) return true;
  
  if (this.inventory.stockQuantity < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.inventory.stockQuantity -= quantity;
  this.inventory.outOfStock = this.inventory.stockQuantity === 0;
  
  return this.save();
};

// Instance method to update rating
menuItemSchema.methods.updateRating = async function(newRating) {
  const currentRating = this.popularity.rating;
  const newCount = currentRating.count + 1;
  const newAverage = ((currentRating.average * currentRating.count) + newRating) / newCount;
  
  this.popularity.rating = {
    average: Math.round(newAverage * 10) / 10, // Round to 1 decimal
    count: newCount
  };
  
  return this.save();
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
  
  return this.find(query).sort({ featured: -1, 'popularity.rating.average': -1, name: 1 });
};

// Static method to find popular items
menuItemSchema.statics.findPopular = function(restaurantId, limit = 10) {
  return this.find({ restaurantId, available: true })
    .sort({ 'popularity.orderCount': -1, 'popularity.rating.average': -1 })
    .limit(limit);
};

// Static method to search menu items
menuItemSchema.statics.search = function(searchTerm, options = {}) {
  const query = { available: true };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
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
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('MenuItem', menuItemSchema);

