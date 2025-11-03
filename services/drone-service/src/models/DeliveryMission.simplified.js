const mongoose = require('mongoose');

const deliveryMissionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    unique: true
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
    enum: ['QUEUED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'FAILED'],
    default: 'QUEUED',
    required: true,
  }
}, {
  timestamps: true
});

// Indexes
deliveryMissionSchema.index({ droneId: 1 });
deliveryMissionSchema.index({ orderId: 1 });
deliveryMissionSchema.index({ missionNumber: 1 });
deliveryMissionSchema.index({ createdAt: -1 });

// Instance method to update status
deliveryMissionSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('DeliveryMission', deliveryMissionSchema);
