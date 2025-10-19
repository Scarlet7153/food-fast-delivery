const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: [
      'ORDER_STATUS_UPDATE',
      'ORDER_CANCELLED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'DRONE_DISPATCHED',
      'DRONE_ARRIVED',
      'DELIVERY_COMPLETED',
      'PROMOTION',
      'SYSTEM_ANNOUNCEMENT',
      'RESTAURANT_UPDATE'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  channels: [{
    type: String,
    enum: ['IN_APP', 'PUSH', 'EMAIL', 'SMS'],
    required: true
  }],
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
    default: 'PENDING',
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL',
    required: true
  },
  // Delivery tracking
  delivery: {
    inApp: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      readAt: Date,
      sentAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      failedAt: Date,
      error: String
    },
    email: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      failedAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      failedAt: Date,
      error: String
    }
  },
  // Scheduling
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  },
  // Related entities
  relatedEntity: {
    type: {
      type: String,
      enum: ['ORDER', 'PAYMENT', 'DRONE', 'RESTAURANT', 'USER']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  // User preferences
  userPreferences: {
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false }
  },
  // Analytics
  analytics: {
    clickCount: { type: Number, default: 0 },
    lastClickedAt: Date,
    deviceInfo: {
      platform: String,
      version: String,
      userAgent: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && new Date() < this.scheduledFor;
});

// Virtual for delivery status summary
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  const delivery = this.delivery;
  
  const status = {
    total: channels.length,
    sent: 0,
    delivered: 0,
    failed: 0
  };
  
  channels.forEach(channel => {
    const channelDelivery = delivery[channel.toLowerCase()];
    if (channelDelivery) {
      if (channelDelivery.sent) status.sent++;
      if (channelDelivery.delivered) status.delivered++;
      if (channelDelivery.failed) status.failed++;
    }
  });
  
  return status;
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'READ';
  this.delivery.inApp.read = true;
  this.delivery.inApp.readAt = new Date();
  
  return this.save();
};

// Instance method to mark as delivered
notificationSchema.methods.markAsDelivered = function(channel) {
  if (this.delivery[channel]) {
    this.delivery[channel].delivered = true;
    this.delivery[channel].deliveredAt = new Date();
  }
  
  // Update overall status if all channels are delivered
  const allDelivered = this.channels.every(ch => 
    this.delivery[ch.toLowerCase()]?.delivered
  );
  
  if (allDelivered && this.status === 'SENT') {
    this.status = 'DELIVERED';
  }
  
  return this.save();
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function(channel) {
  if (this.delivery[channel]) {
    this.delivery[channel].sent = true;
    this.delivery[channel].sentAt = new Date();
  }
  
  // Update overall status if at least one channel is sent
  const anySent = this.channels.some(ch => 
    this.delivery[ch.toLowerCase()]?.sent
  );
  
  if (anySent && this.status === 'PENDING') {
    this.status = 'SENT';
  }
  
  return this.save();
};

// Instance method to mark as failed
notificationSchema.methods.markAsFailed = function(channel, error) {
  if (this.delivery[channel]) {
    this.delivery[channel].failed = true;
    this.delivery[channel].failedAt = new Date();
    this.delivery[channel].error = error;
  }
  
  // Update overall status if all channels failed
  const allFailed = this.channels.every(ch => 
    this.delivery[ch.toLowerCase()]?.failed
  );
  
  if (allFailed) {
    this.status = 'FAILED';
  }
  
  return this.save();
};

// Instance method to record click
notificationSchema.methods.recordClick = function(deviceInfo) {
  this.analytics.clickCount += 1;
  this.analytics.lastClickedAt = new Date();
  
  if (deviceInfo) {
    this.analytics.deviceInfo = deviceInfo;
  }
  
  return this.save();
};

// Static method to find by user
notificationSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.unreadOnly) {
    query.status = { $in: ['PENDING', 'SENT', 'DELIVERED'] };
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Static method to find pending notifications
notificationSchema.statics.findPending = function() {
  return this.find({
    status: 'PENDING',
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  });
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = function(userId, dateFrom, dateTo) {
  const matchStage = { userId };
  
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
        totalNotifications: { $sum: 1 },
        readNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] }
        },
        unreadNotifications: {
          $sum: { $cond: [{ $in: ['$status', ['PENDING', 'SENT', 'DELIVERED']] }, 1, 0] }
        },
        failedNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        typeCounts: {
          $push: '$type'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalNotifications: 1,
        readNotifications: 1,
        unreadNotifications: 1,
        failedNotifications: 1,
        readRate: {
          $round: [
            { $multiply: [{ $divide: ['$readNotifications', '$totalNotifications'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
