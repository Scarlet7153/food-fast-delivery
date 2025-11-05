const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  name: {
    type: String,
    required: [true, 'Drone name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  model: {
    type: String,
    trim: true,
    default: 'Standard Delivery Drone',
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['IDLE', 'BUSY'],
    default: 'IDLE',
    required: true,
  },
  maxPayloadGrams: {
    type: Number,
    default: 2000,
    min: [100, 'Maximum payload must be at least 100 grams'],
    max: [10000, 'Maximum payload cannot exceed 10000 grams']
  },
  maxRangeMeters: {
    type: Number,
    default: 10000,
    min: [100, 'Range must be at least 100 meters'],
    max: [50000, 'Range cannot exceed 50000 meters']
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  currentMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryMission'
  },
  // Maintenance tracking
  maintenance: {
    totalFlightHours: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFlights: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
droneSchema.index({ restaurantId: 1, status: 1 });
droneSchema.index({ status: 1 });

// Instance method to check if drone is available
droneSchema.methods.isAvailable = function() {
  return this.status === 'IDLE';
};

// Instance method to update location
droneSchema.methods.updateLocation = function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    timestamp: new Date()
  };
  
  return this.save();
};

// Instance method to update status
droneSchema.methods.updateStatus = function(newStatus) {
  const validStatuses = ['IDLE', 'BUSY'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Must be IDLE or BUSY`);
  }
  
  this.status = newStatus;
  
  // Clear mission when returning to IDLE
  if (newStatus === 'IDLE') {
    this.currentMission = undefined;
  }
  
  return this.save();
};

// Static method to find available drones
droneSchema.statics.findAvailable = function(restaurantId) {
  return this.find({
    restaurantId,
    status: 'IDLE'
  });
};

module.exports = mongoose.model('Drone', droneSchema);
