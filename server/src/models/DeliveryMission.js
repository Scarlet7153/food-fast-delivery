const mongoose = require('mongoose');

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
    enum: [
      'QUEUED',
      'PREPARING',
      'TAKEOFF',
      'CRUISING',
      'APPROACHING',
      'LANDING',
      'DELIVERED',
      'RETURNING',
      'COMPLETED',
      'ABORTED',
      'FAILED'
    ],
    default: 'QUEUED',
    required: true,
  },
  // Route planning
  route: {
    pickup: {
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      },
      address: String,
      instructions: String
    },
    delivery: {
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      },
      address: String,
      instructions: String,
      contactPhone: String,
      contactName: String
    },
    waypoints: [{
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number] // [longitude, latitude]
      },
      altitude: Number,
      speed: Number,
      action: {
        type: String,
        enum: ['FLY_OVER', 'HOVER', 'LAND', 'PICKUP', 'DROP_OFF']
      }
    }]
  },
  // Flight path tracking
  path: [{
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    altitude: {
      type: Number,
      default: 0
    },
    heading: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    batteryPercent: {
      type: Number,
      default: 100
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Estimates and actuals
  estimates: {
    distanceKm: {
      type: Number,
      required: true,
      min: 0
    },
    etaMinutes: {
      type: Number,
      required: true,
      min: 1
    },
    batteryConsumption: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  actuals: {
    distanceKm: {
      type: Number,
      min: 0
    },
    durationMinutes: {
      type: Number,
      min: 0
    },
    batteryConsumption: {
      type: Number,
      min: 0,
      max: 100
    },
    maxSpeed: {
      type: Number,
      min: 0
    },
    averageSpeed: {
      type: Number,
      min: 0
    }
  },
  // Timeline and events
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number
    },
    note: String,
    batteryPercent: Number
  }],
  // Weather and conditions
  weather: {
    windSpeed: Number, // km/h
    windDirection: Number, // degrees
    temperature: Number, // celsius
    visibility: Number, // km
    conditions: {
      type: String,
      enum: ['CLEAR', 'CLOUDY', 'RAINY', 'STORMY', 'FOGGY']
    }
  },
  // Mission parameters
  parameters: {
    maxAltitude: {
      type: Number,
      default: 120, // meters
      min: 50,
      max: 500
    },
    maxSpeed: {
      type: Number,
      default: 50, // km/h
      min: 10,
      max: 100
    },
    payloadWeight: {
      type: Number,
      required: true,
      min: 0
    },
    emergencyContact: {
      name: String,
      phone: String
    }
  },
  // Completion info
  completedAt: Date,
  deliveredAt: Date,
  returnedAt: Date,
  // Failure info
  failure: {
    reason: String,
    code: String,
    description: String,
    occurredAt: Date,
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number
    }
  },
  // Performance metrics
  performance: {
    efficiency: Number, // percentage
    accuracy: Number, // percentage
    customerSatisfaction: Number, // 1-5 rating
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
deliveryMissionSchema.index({ restaurantId: 1, status: 1 });
deliveryMissionSchema.index({ droneId: 1, status: 1 });
deliveryMissionSchema.index({ orderId: 1 });
deliveryMissionSchema.index({ missionNumber: 1 });
deliveryMissionSchema.index({ createdAt: -1 });

// Virtual for order info
deliveryMissionSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for restaurant info
deliveryMissionSchema.virtual('restaurant', {
  ref: 'Restaurant',
  localField: 'restaurantId',
  foreignField: '_id',
  justOne: true
});

// Virtual for drone info
deliveryMissionSchema.virtual('drone', {
  ref: 'Drone',
  localField: 'droneId',
  foreignField: '_id',
  justOne: true
});

// Virtual for mission duration
deliveryMissionSchema.virtual('duration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for current progress
deliveryMissionSchema.virtual('progress').get(function() {
  const statusProgress = {
    QUEUED: 0,
    PREPARING: 10,
    TAKEOFF: 20,
    CRUISING: 40,
    APPROACHING: 80,
    LANDING: 90,
    DELIVERED: 95,
    RETURNING: 98,
    COMPLETED: 100,
    ABORTED: 0,
    FAILED: 0
  };
  return statusProgress[this.status] || 0;
});

// Pre-save middleware to generate mission number
deliveryMissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.missionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last mission of the day
    const lastMission = await this.constructor.findOne({
      missionNumber: new RegExp(`^MSN${year}${month}${day}`)
    }).sort({ missionNumber: -1 });
    
    let sequence = 1;
    if (lastMission) {
      const lastSequence = parseInt(lastMission.missionNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.missionNumber = `MSN${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to add timeline entry
deliveryMissionSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    const latestPathPoint = this.path[this.path.length - 1];
    
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      location: latestPathPoint ? {
        latitude: latestPathPoint.latitude,
        longitude: latestPathPoint.longitude,
        altitude: latestPathPoint.altitude
      } : undefined,
      note: this.getStatusNote(this.status),
      batteryPercent: latestPathPoint ? latestPathPoint.batteryPercent : undefined
    });
  }
  next();
});

// Instance method to get status note
deliveryMissionSchema.methods.getStatusNote = function(status) {
  const statusNotes = {
    QUEUED: 'Mission queued for execution',
    PREPARING: 'Drone preparing for takeoff',
    TAKEOFF: 'Drone taking off',
    CRUISING: 'Drone cruising to destination',
    APPROACHING: 'Drone approaching delivery location',
    LANDING: 'Drone landing at destination',
    DELIVERED: 'Package delivered successfully',
    RETURNING: 'Drone returning to base',
    COMPLETED: 'Mission completed successfully',
    ABORTED: 'Mission aborted',
    FAILED: 'Mission failed'
  };
  return statusNotes[status] || '';
};

// Instance method to update status
deliveryMissionSchema.methods.updateStatus = function(newStatus, note) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'DELIVERED') {
    this.deliveredAt = new Date();
  }
  
  if (newStatus === 'COMPLETED') {
    this.completedAt = new Date();
  }
  
  if (newStatus === 'RETURNING') {
    this.returnedAt = new Date();
  }
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || this.getStatusNote(newStatus)
  });
  
  return this.save();
};

// Instance method to check if status transition is valid
deliveryMissionSchema.methods.canTransitionTo = function(newStatus) {
  const validTransitions = {
    QUEUED: ['PREPARING', 'ABORTED'],
    PREPARING: ['TAKEOFF', 'ABORTED'],
    TAKEOFF: ['CRUISING', 'ABORTED', 'FAILED'],
    CRUISING: ['APPROACHING', 'RETURNING', 'ABORTED', 'FAILED'],
    APPROACHING: ['LANDING', 'ABORTED', 'FAILED'],
    LANDING: ['DELIVERED', 'ABORTED', 'FAILED'],
    DELIVERED: ['RETURNING', 'ABORTED', 'FAILED'],
    RETURNING: ['COMPLETED', 'ABORTED', 'FAILED'],
    COMPLETED: [], // Final state
    ABORTED: [], // Final state
    FAILED: [] // Final state
  };
  
  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Instance method to add path point
deliveryMissionSchema.methods.addPathPoint = function(latitude, longitude, altitude, heading, speed, batteryPercent) {
  this.path.push({
    latitude,
    longitude,
    altitude,
    heading,
    speed,
    batteryPercent,
    timestamp: new Date()
  });
  
  // Update actual distance if we have at least 2 points
  if (this.path.length >= 2) {
    this.actuals.distanceKm = this.calculateTotalDistance();
  }
  
  return this.save();
};

// Instance method to calculate total distance
deliveryMissionSchema.methods.calculateTotalDistance = function() {
  if (this.path.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < this.path.length; i++) {
    const prev = this.path[i - 1];
    const curr = this.path[i];
    totalDistance += this.calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  
  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
};

// Instance method to calculate distance between two points
deliveryMissionSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
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
deliveryMissionSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

// Instance method to abort mission
deliveryMissionSchema.methods.abortMission = function(reason, code, description, location) {
  this.status = 'ABORTED';
  this.failure = {
    reason,
    code,
    description,
    occurredAt: new Date(),
    location
  };
  
  this.timeline.push({
    status: 'ABORTED',
    timestamp: new Date(),
    note: `Mission aborted: ${reason}`,
    location
  });
  
  return this.save();
};

// Instance method to fail mission
deliveryMissionSchema.methods.failMission = function(reason, code, description, location) {
  this.status = 'FAILED';
  this.failure = {
    reason,
    code,
    description,
    occurredAt: new Date(),
    location
  };
  
  this.timeline.push({
    status: 'FAILED',
    timestamp: new Date(),
    note: `Mission failed: ${reason}`,
    location
  });
  
  return this.save();
};

// Instance method to complete mission
deliveryMissionSchema.methods.completeMission = function() {
  if (this.status !== 'RETURNING') {
    throw new Error('Mission must be in RETURNING status to complete');
  }
  
  this.status = 'COMPLETED';
  this.completedAt = new Date();
  
  // Calculate final actuals
  if (this.createdAt && this.completedAt) {
    this.actuals.durationMinutes = Math.round((this.completedAt - this.createdAt) / (1000 * 60));
  }
  
  if (this.path.length > 0) {
    const firstPoint = this.path[0];
    const lastPoint = this.path[this.path.length - 1];
    this.actuals.batteryConsumption = firstPoint.batteryPercent - lastPoint.batteryPercent;
    
    // Calculate average speed
    if (this.actuals.durationMinutes > 0) {
      this.actuals.averageSpeed = this.actuals.distanceKm / (this.actuals.durationMinutes / 60);
    }
    
    // Calculate max speed
    this.actuals.maxSpeed = Math.max(...this.path.map(p => p.speed || 0));
  }
  
  this.timeline.push({
    status: 'COMPLETED',
    timestamp: new Date(),
    note: 'Mission completed successfully'
  });
  
  return this.save();
};

// Static method to find by restaurant
deliveryMissionSchema.statics.findByRestaurant = function(restaurantId, options = {}) {
  const query = { restaurantId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.droneId) {
    query.droneId = options.droneId;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .populate('orderId', 'orderNumber items amount deliveryAddress')
    .populate('droneId', 'name serial status')
    .sort({ createdAt: -1 });
};

// Static method to get mission statistics
deliveryMissionSchema.statics.getStatistics = function(restaurantId, dateFrom, dateTo) {
  const matchStage = { restaurantId };
  
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
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
        averageDuration: { $avg: '$actuals.durationMinutes' },
        averageDistance: { $avg: '$actuals.distanceKm' },
        averageBatteryConsumption: { $avg: '$actuals.batteryConsumption' }
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
          $round: [
            { $multiply: [{ $divide: ['$completedMissions', '$totalMissions'] }, 100] },
            2
          ]
        },
        averageDuration: { $round: ['$averageDuration', 1] },
        averageDistance: { $round: ['$averageDistance', 2] },
        averageBatteryConsumption: { $round: ['$averageBatteryConsumption', 1] }
      }
    }
  ]);
};

module.exports = mongoose.model('DeliveryMission', deliveryMissionSchema);

