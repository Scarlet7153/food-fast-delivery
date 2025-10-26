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
  serialNumber: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
    trim: true,
    maxlength: [50, 'Serial number cannot exceed 50 characters']
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
  // Battery
  batteryLevel: {
    type: Number,
    default: 100,
    min: [0, 'Battery level cannot be negative'],
    max: [100, 'Battery level cannot exceed 100']
  },
  // Physical specifications
  maxPayloadGrams: {
    type: Number,
    required: [true, 'Maximum payload is required'],
    default: 1000,
    min: [100, 'Maximum payload must be at least 100 grams'],
    max: [10000, 'Maximum payload cannot exceed 10000 grams']
  },
  maxRangeMeters: {
    type: Number,
    required: [true, 'Range is required'],
    default: 5000,
    min: [100, 'Range must be at least 100 meters'],
    max: [50000, 'Range cannot exceed 50000 meters']
  },
  maxFlightTimeMinutes: {
    type: Number,
    default: 30,
    min: [5, 'Flight time must be at least 5 minutes'],
    max: [120, 'Flight time cannot exceed 120 minutes']
  },
  // Location
  currentLocation: {
    type: {
      lat: Number,
      lng: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    required: false
  },
  // Maintenance and health
  maintenance: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    maintenanceIntervalDays: {
      type: Number,
      default: 30
    },
    totalFlightHours: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFlights: {
      type: Number,
      default: 0,
      min: 0
    },
    healthStatus: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'],
      default: 'EXCELLENT'
    },
    issues: [{
      type: String,
      description: String,
      reportedAt: {
        type: Date,
        default: Date.now
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  // Performance metrics
  performance: {
    averageFlightTime: {
      type: Number,
      default: 0 // minutes
    },
    successRate: {
      type: Number,
      default: 100, // percentage
      min: 0,
      max: 100
    },
    averageSpeed: {
      type: Number,
      default: 0 // km/h
    },
    fuelEfficiency: {
      type: Number,
      default: 0 // km per battery percentage
    }
  },
  // Current mission
  currentMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryMission'
  },
  // Settings
  settings: {
    autoReturn: {
      type: Boolean,
      default: true
    },
    lowBatteryThreshold: {
      type: Number,
      default: 20, // percentage
      min: 5,
      max: 50
    },
    maxFlightTime: {
      type: Number,
      default: 30, // minutes
      min: 5,
      max: 120
    },
    emergencyLanding: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
droneSchema.index({ restaurantId: 1, status: 1 });
droneSchema.index({ serialNumber: 1 });
droneSchema.index({ 'maintenance.nextMaintenance': 1 });

// Virtual for battery status
droneSchema.virtual('batteryStatus').get(function() {
  if (this.batteryLevel >= 80) return 'HIGH';
  if (this.batteryLevel >= 50) return 'MEDIUM';
  if (this.batteryLevel >= 20) return 'LOW';
  return 'CRITICAL';
});

// Virtual for maintenance status
droneSchema.virtual('maintenanceStatus').get(function() {
  if (!this.maintenance.nextMaintenance) return 'UNKNOWN';
  
  const daysUntilMaintenance = Math.ceil(
    (this.maintenance.nextMaintenance - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilMaintenance <= 0) return 'OVERDUE';
  if (daysUntilMaintenance <= 3) return 'DUE_SOON';
  return 'OK';
});

// Instance method to check if drone is available
droneSchema.methods.isAvailable = function() {
  return this.status === 'IDLE' && 
         this.batteryLevel >= this.settings.lowBatteryThreshold &&
         this.maintenance.healthStatus !== 'CRITICAL' &&
         this.maintenanceStatus !== 'OVERDUE';
};

// Instance method to calculate distance between two points
droneSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = this.toRadians(lat2 - lat1);
  const dLon = this.toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper method to convert degrees to radians
droneSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
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
  // Validate that newStatus is one of the allowed values
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

// Instance method to schedule maintenance
droneSchema.methods.scheduleMaintenance = function(daysFromNow = 30) {
  this.maintenance.lastMaintenance = new Date();
  this.maintenance.nextMaintenance = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  
  return this.save();
};

// Instance method to record flight
droneSchema.methods.recordFlight = function(duration, success = true) {
  this.maintenance.totalFlights += 1;
  this.maintenance.totalFlightHours += duration / 60; // convert minutes to hours
  
  // Update performance metrics
  const currentAvg = this.performance.averageFlightTime;
  const totalFlights = this.maintenance.totalFlights;
  this.performance.averageFlightTime = ((currentAvg * (totalFlights - 1)) + duration) / totalFlights;
  
  if (success) {
    this.performance.successRate = ((this.performance.successRate * (totalFlights - 1)) + 100) / totalFlights;
  } else {
    this.performance.successRate = ((this.performance.successRate * (totalFlights - 1)) + 0) / totalFlights;
  }
  
  return this.save();
};

// Static method to find available drones
droneSchema.statics.findAvailable = function(restaurantId, minBattery = 30) {
  return this.find({
    restaurantId,
    status: 'IDLE',
    batteryLevel: { $gte: minBattery },
    'maintenance.healthStatus': { $ne: 'CRITICAL' },
    $or: [
      { 'maintenance.nextMaintenance': { $exists: false } },
      { 'maintenance.nextMaintenance': { $gt: new Date() } }
    ]
  });
};

module.exports = mongoose.model('Drone', droneSchema);
