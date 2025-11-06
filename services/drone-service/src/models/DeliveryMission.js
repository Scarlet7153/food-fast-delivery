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
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'FAILED', 'CANCELLED', 'ABORTED'],
    default: 'PENDING',
    required: true,
  }
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

// Pre-save hook to generate mission number
deliveryMissionSchema.pre('save', async function(next) {
  if (!this.missionNumber) {
    const count = await this.constructor.countDocuments();
    this.missionNumber = `M${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Instance method to update status
deliveryMissionSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
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
    .populate('droneId', 'name model status')
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
        }
      }
    }
  ]);
};

module.exports = mongoose.model('DeliveryMission', deliveryMissionSchema);
