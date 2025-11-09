const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  paymentNumber: {
    type: String,
    unique: true,
    required: true
  },
  method: {
    type: String,
  enum: ['MOMO'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    required: true
  },
  amount: {
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR']
    },
    breakdown: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      deliveryFee: {
        type: Number,
        required: true,
        min: 0
      },
      tax: {
        type: Number,
        default: 0,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  // MoMo specific data
  momo: {
    requestId: String,
    transId: String,
    payUrl: String,
    qrCodeUrl: String,
    deeplink: String,
    applink: String,
    signature: String,
    resultCode: Number,
    responseTime: String,
    extraData: String
  },
  // Bank transfer data
  bankTransfer: {
    bankCode: String,
    bankName: String,
    accountNumber: String,
    accountName: String,
    transferContent: String,
    transferTime: Date
  },
  // Credit card data (encrypted)
  creditCard: {
    cardType: String, // visa, mastercard, etc.
    last4Digits: String,
    expiryMonth: String,
    expiryYear: String,
    holderName: String
  },
  // Payment timeline
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Payment processing details
  processing: {
    gateway: String, // momo, vnpay, etc.
    gatewayTransactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    processingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    netAmount: {
      type: Number,
      min: 0
    }
  },
  // Refund information
  refund: {
    refundId: String,
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: String,
    refundStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
    },
    refundedAt: Date,
    refundMethod: String
  },
  // Security and validation
  security: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Metadata
  metadata: {
    customerInfo: {
      name: String,
      email: String,
      phone: String
    },
    orderInfo: {
      orderNumber: String,
      items: [{
        name: String,
        quantity: Number,
        price: Number
      }]
    },
    deliveryInfo: {
      address: String,
      contactPhone: String
    }
  },
  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  },
  // Completion timestamps
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// `orderId` is already unique on the schema path, avoid duplicate index declaration
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ restaurantId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
// `paymentNumber` is already unique on the schema path, avoid duplicate index declaration
paymentSchema.index({ 'momo.transId': 1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for payment duration
paymentSchema.virtual('duration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for is expired
paymentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Pre-save middleware to generate payment number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last payment of the day
    const lastPayment = await this.constructor.findOne({
      paymentNumber: new RegExp(`^PAY${year}${month}${day}`)
    }).sort({ paymentNumber: -1 });
    
    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.paymentNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.paymentNumber = `PAY${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to add timeline entry
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: this.getStatusNote(this.status)
    });
  }
  next();
});

// Instance method to get status note
paymentSchema.methods.getStatusNote = function(status) {
  const statusNotes = {
    PENDING: 'Payment request created',
    PROCESSING: 'Payment is being processed',
    COMPLETED: 'Payment completed successfully',
    FAILED: 'Payment failed',
    CANCELLED: 'Payment cancelled',
    REFUNDED: 'Payment refunded'
  };
  return statusNotes[status] || '';
};

// Instance method to update status
paymentSchema.methods.updateStatus = function(newStatus, note, metadata) {
  this.status = newStatus;
  
  if (newStatus === 'COMPLETED') {
    this.completedAt = new Date();
    // Remove TTL - payment should not be auto-deleted after successful completion
    this.expiresAt = null;
  } else if (newStatus === 'FAILED') {
    this.failedAt = new Date();
  } else if (newStatus === 'CANCELLED') {
    this.cancelledAt = new Date();
  }
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || this.getStatusNote(newStatus),
    metadata: metadata || {}
  });
  
  return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(refundAmount, reason, method = 'ORIGINAL') {
  if (this.status !== 'COMPLETED') {
    throw new Error('Can only refund completed payments');
  }
  
  if (refundAmount > this.amount.total) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund = {
    refundAmount,
    refundReason: reason,
    refundStatus: 'PENDING',
    refundMethod: method
  };
  
  this.status = 'REFUNDED';
  this.refundedAt = new Date();
  
  this.timeline.push({
    status: 'REFUNDED',
    timestamp: new Date(),
    note: `Refund processed: ${reason}`,
    metadata: { refundAmount, reason, method }
  });
  
  return this.save();
};

// Static method to find by user
paymentSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.method) {
    query.method = options.method;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Static method to find by restaurant
paymentSchema.statics.findByRestaurant = function(restaurantId, options = {}) {
  const query = { restaurantId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.method) {
    query.method = options.method;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = function(restaurantId, dateFrom, dateTo) {
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
        totalPayments: { $sum: 1 },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$amount.total' },
        averagePaymentValue: { $avg: '$amount.total' },
        methodCounts: {
          $push: '$method'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalPayments: 1,
        completedPayments: 1,
        failedPayments: 1,
        totalRevenue: 1,
        averagePaymentValue: { $round: ['$averagePaymentValue', 0] },
        successRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedPayments', '$totalPayments'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
