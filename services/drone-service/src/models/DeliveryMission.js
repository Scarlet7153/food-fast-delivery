const mongoose = require('mongoose');

// Location schema for route points
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

// Path point schema for tracking drone movement
const pathPointSchema = new mongoose.Schema({
  location: locationSchema,
  altitude: Number,
  heading: Number,
  speed: Number,
  batteryPercent: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const deliveryMissionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    unique: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  droneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
    required: [true, 'Drone ID is required']
  },
  missionNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'FAILED', 'CANCELLED', 'ABORTED'],
    default: 'PENDING',
    required: true,
  },
  // Route information
  route: {
    pickup: {
      location: locationSchema,
      address: String,
      instructions: String
    },
    delivery: {
      location: locationSchema,
      address: String,
      instructions: String,
      contactPhone: String,
      contactName: String
    }
  },
  // Estimated values
  estimates: {
    distanceKm: Number,
    etaMinutes: Number,
    batteryConsumption: Number
  },
  // Actual values (filled during/after mission)
  actual: {
    distanceKm: Number,
    durationMinutes: Number,
    batteryUsed: Number,
    startTime: Date,
    endTime: Date
  },
  // Mission parameters
  parameters: {
    payloadWeight: Number, // in grams
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    }
  },
  // Flight path tracking
  flightPath: [pathPointSchema],
  // Status history
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  // Estimated arrival time
  estimatedArrival: Date,
  // Notes
  notes: String,
  failureReason: String
}, {
  timestamps: true
});

// Indexes
deliveryMissionSchema.index({ droneId: 1 });
deliveryMissionSchema.index({ orderId: 1 });
deliveryMissionSchema.index({ restaurantId: 1 });
deliveryMissionSchema.index({ missionNumber: 1 });
deliveryMissionSchema.index({ createdAt: -1 });
deliveryMissionSchema.index({ status: 1 });
deliveryMissionSchema.index({ 'route.pickup.location': '2dsphere' });
deliveryMissionSchema.index({ 'route.delivery.location': '2dsphere' });

// Pre-save hook to generate mission number
deliveryMissionSchema.pre('save', async function(next) {
  if (!this.missionNumber) {
    const count = await this.constructor.countDocuments();
    this.missionNumber = `M${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Instance method to update status
deliveryMissionSchema.methods.updateStatus = async function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note
  });
  
  // Update actual times
  if (newStatus === 'IN_PROGRESS' && !this.actual.startTime) {
    this.actual.startTime = new Date();
  }
  if (['DELIVERED', 'COMPLETED', 'FAILED', 'ABORTED'].includes(newStatus) && !this.actual.endTime) {
    this.actual.endTime = new Date();
    if (this.actual.startTime) {
      this.actual.durationMinutes = Math.round((this.actual.endTime - this.actual.startTime) / (1000 * 60));
    }
  }
  
  return this.save();
};

// Instance method to add path point
deliveryMissionSchema.methods.addPathPoint = async function(latitude, longitude, altitude, heading, speed, batteryPercent) {
  this.flightPath.push({
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    altitude,
    heading,
    speed,
    batteryPercent,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to find missions by restaurant
deliveryMissionSchema.statics.findByRestaurant = function(restaurantId, options = {}) {
  const query = { restaurantId };
  
  if (options.status) query.status = options.status;
  if (options.droneId) query.droneId = options.droneId;
  
  const dateQuery = {};
  if (options.dateFrom) dateQuery.$gte = new Date(options.dateFrom);
  if (options.dateTo) dateQuery.$lte = new Date(options.dateTo);
  if (Object.keys(dateQuery).length > 0) query.createdAt = dateQuery;
  
  return this.find(query)
    .populate('droneId', 'name model status batteryLevel')
    .populate('orderId', 'orderNumber amount items deliveryAddress')
    .sort({ createdAt: -1 });
};

// Static method to get statistics
deliveryMissionSchema.statics.getStatistics = function(restaurantId, dateFrom, dateTo) {
  const match = { restaurantId: mongoose.Types.ObjectId(restaurantId) };
  
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
    if (dateTo) match.createdAt.$lte = new Date(dateTo);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMissions: { $sum: 1 },
        completedMissions: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedMissions: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        abortedMissions: {
          $sum: { $cond: [{ $eq: ['$status', 'ABORTED'] }, 1, 0] }
        },
        averageDuration: { $avg: '$actual.durationMinutes' },
        averageDistance: { $avg: '$actual.distanceKm' },
        averageBatteryConsumption: { $avg: '$actual.batteryUsed' }
      }
    },
    {
      $project: {
        _id: 0,
        totalMissions: 1,
        completedMissions: 1,
        failedMissions: 1,
        abortedMissions: 1,
        successRate: {
          $multiply: [
            { $divide: ['$completedMissions', '$totalMissions'] },
            100
          ]
        },
        averageDuration: { $round: ['$averageDuration', 2] },
        averageDistance: { $round: ['$averageDistance', 2] },
        averageBatteryConsumption: { $round: ['$averageBatteryConsumption', 2] }
      }
    }
  ]);
};

// Instance method to get status note
deliveryMissionSchema.methods.getStatusNote = function(status) {
  const notes = {
    'PENDING': 'Mission is waiting to be assigned',
    'ASSIGNED': 'Drone has been assigned',
    'IN_PROGRESS': 'Drone is on the way',
    'DELIVERED': 'Package delivered successfully',
    'COMPLETED': 'Mission completed',
    'FAILED': 'Mission failed',
    'CANCELLED': 'Mission cancelled',
    'ABORTED': 'Mission aborted'
  };
  return notes[status] || 'Status updated';
};

module.exports = mongoose.model('DeliveryMission', deliveryMissionSchema);
