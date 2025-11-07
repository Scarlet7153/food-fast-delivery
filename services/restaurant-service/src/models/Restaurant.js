const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner user is required'],
    unique: true
  },
  ownerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  imageUrl: {
    type: String,
    trim: true
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
  },
  active: {
    type: Boolean,
    default: false // Needs admin approval
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  rejectedAt: {
    type: Date
  },
  // MoMo payment configuration
  momo: {
    partnerCode: {
      type: String,
      trim: true
    },
    accessKey: {
      type: String,
      trim: true
    },
    secretKey: {
      type: String,
      trim: true
    }
  },
  // Delivery settings
  deliverySettings: {
    baseRate: {
      type: Number,
      default: 10000, // 10,000 VND base delivery fee
      min: 0
    },
    ratePerKm: {
      type: Number,
      default: 5000, // 5,000 VND per km
      min: 0
    },
    maxDeliveryDistance: {
      type: Number,
      default: 10, // 10 km max delivery distance
      min: 1
    },
    estimatedPrepTime: {
      type: Number,
      default: 15, // 15 minutes average prep time
      min: 5
    }
  },
  // Store status
  isOpen: {
    type: Boolean,
    default: false // Restaurant is closed by default
  },
  // Statistics
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// ownerUserId already has `unique: true` on the schema path, so avoid duplicate index declaration
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ active: 1, approved: 1 });
restaurantSchema.index({ name: 'text', description: 'text' });

// Instance method to check if restaurant is accepting orders
restaurantSchema.methods.canAcceptOrders = function() {
  return this.active && this.approved && this.isOpen;
};

// Instance method to calculate delivery fee
restaurantSchema.methods.calculateDeliveryFee = function(distanceKm) {
  const settings = this.deliverySettings;
  if (distanceKm > settings.maxDeliveryDistance) {
    return null; // Too far
  }
  
  return settings.baseRate + (distanceKm * settings.ratePerKm);
};

// Instance method to update rating
restaurantSchema.methods.updateRating = async function(newRating) {
  const currentRating = this.rating;
  const newCount = currentRating.count + 1;
  const newAverage = ((currentRating.average * currentRating.count) + newRating) / newCount;
  
  this.rating = {
    average: Math.round(newAverage * 10) / 10, // Round to 1 decimal
    count: newCount
  };
  
  return this.save();
};

// Static method to find nearby restaurants
restaurantSchema.statics.findNearby = function(longitude, latitude, maxDistanceKm = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistanceKm * 1000 // Convert km to meters
      }
    },
    active: true,
    approved: true
  });
};

// Static method to find active restaurants
restaurantSchema.statics.findActive = function() {
  return this.find({ active: true, approved: true });
};

// Static method to find pending approval
restaurantSchema.statics.findPendingApproval = function() {
  return this.find({ approved: false });
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
