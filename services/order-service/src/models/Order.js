const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  restaurant: {
    name: {
      type: String
    },
    description: {
      type: String
    },
    imageUrl: {
      type: String
    },
    phone: {
      type: String
    },
  },
  orderNumber: {
    type: String,
    unique: true,
    required: false
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    specialInstructions: {
      type: String,
      maxlength: 200
    }
  }],
  amount: {
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
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['MOMO', 'COD'],
      default: 'MOMO',
      required: true
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      required: true
    },
    momo: {
      requestId: String,
      orderId: String,
      transId: String,
      payUrl: String,
      qrCodeUrl: String,
      signature: String
    },
    paidAt: Date,
    refundedAt: Date
  },
  status: {
    type: String,
    enum: [
      'PLACED',
      'CONFIRMED', 
      'COOKING',
      'READY_FOR_PICKUP',
      'IN_FLIGHT',
      'DELIVERED',
      'CANCELLED',
      'FAILED'
    ],
    default: 'PLACED',
    required: true,
  },
  deliveryAddress: {
    text: {
      type: String,
      required: [true, 'Delivery address is required'],
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Delivery coordinates are required'],
        index: '2dsphere'
      }
    },
    contactPhone: String,
    contactName: String,
    notes: String
  },
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryMission'
  },
  droneInfo: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    model: String,
    maxPayloadGrams: Number,
    maxRangeMeters: Number,
    status: String
  },
  // Customer feedback
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    ratedAt: Date
  },
  // Cancellation info
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'deliveryAddress.location': '2dsphere' });

// Virtual for duration
orderSchema.virtual('duration').get(function() {
  if (this.status === 'DELIVERED' && this.actualDeliveryTime) {
    return Math.round((this.actualDeliveryTime - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for estimated duration
orderSchema.virtual('estimatedDuration').get(function() {
  if (this.estimatedDeliveryTime) {
    return Math.round((this.estimatedDeliveryTime - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  console.log('Pre-save middleware running, isNew:', this.isNew, 'orderNumber:', this.orderNumber);
  if (this.isNew && !this.orderNumber) {
    console.log('Generating order number...');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of the day
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD${year}${month}${day}`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    console.log('Generated order number:', this.orderNumber);
  }
  next();
});

// Pre-save middleware to add timeline entry
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    // Check if timeline entry already exists for this status change
    const lastEntry = this.timeline[this.timeline.length - 1];
    const now = new Date();
    
    // Only add if no recent entry exists (within 1 second) or if it's a different status
    if (!lastEntry || 
        lastEntry.status !== this.status || 
        (now - lastEntry.timestamp) > 1000) {
      this.timeline.push({
        status: this.status,
        timestamp: now,
        note: this.getStatusNote(this.status)
      });
    }
  }
  next();
});
// Tổng hop doanh thu theo nhà hàng
const getRestaurantRevenue = async (restaurantId) => {
  const revenue = await Order.aggregate([
    // Lọc các đơn hàng của nhà hàng
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        status: 'completed' // chỉ tính các đơn đã hoàn thành
      }
    },
    // Tính tổng tiền từ tất cả các đơn hàng
    {
      $group: {
        _id: '$restaurantId',
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        // Có thể thêm thống kê theo thời gian
        daily: {
          $push: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: '$totalAmount'
          }
        }
      }
    },
    // Nhóm theo ngày để có thống kê theo thời gian
    {
      $addFields: {
        dailyStats: {
          $reduce: {
            input: '$daily',
            initialValue: [],
            in: {
              $concatArrays: [
                '$$value',
                [{
                  date: '$$this.date',
                  amount: '$$this.amount'
                }]
              ]
            }
          }
        }
      }
    },
    // Projection để format kết quả
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalOrders: 1,
        dailyStats: {
          $sortArray: { 
            input: '$dailyStats', 
            sortBy: { date: -1 } 
          }
        }
      }
    }
  ]);

  return revenue[0] || { totalRevenue: 0, totalOrders: 0, dailyStats: [] };
};
// Instance method to get status note
orderSchema.methods.getStatusNote = function(status) {
  const statusNotes = {
    PLACED: 'Khách hàng đã đặt đơn hàng',
    CONFIRMED: 'Đơn hàng đã được nhà hàng xác nhận',
    COOKING: 'Món ăn đang được chuẩn bị',
    READY_FOR_PICKUP: 'Món ăn đã sẵn sàng để drone lấy',
    IN_FLIGHT: 'Drone đang giao đơn hàng của bạn',
    DELIVERED: 'Đơn hàng đã được giao thành công',
    CANCELLED: 'Đơn hàng đã bị hủy',
    FAILED: 'Đơn hàng thất bại'
  };
  return statusNotes[status] || '';
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, updatedBy, note) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'DELIVERED') {
    this.actualDeliveryTime = new Date();
  }
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || this.getStatusNote(newStatus),
    updatedBy: updatedBy
  });
  
  return this.save();
};

// Instance method to check if status transition is valid
orderSchema.methods.canTransitionTo = function(newStatus) {
  const validTransitions = {
    PLACED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['COOKING', 'CANCELLED'],
    COOKING: ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['IN_FLIGHT', 'CANCELLED'],
    IN_FLIGHT: ['DELIVERED', 'FAILED'],
    DELIVERED: [], // Final state
    CANCELLED: [], // Final state
    FAILED: [] // Final state
  };
  
  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Instance method to calculate estimated delivery time
orderSchema.methods.calculateEstimatedDeliveryTime = function() {
  const prepTime = 15; // estimated prep time in minutes
  const deliveryTime = 10; // estimated drone delivery time in minutes
  
  this.estimatedDeliveryTime = new Date(Date.now() + (prepTime + deliveryTime) * 60 * 1000);
  return this.estimatedDeliveryTime;
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason, cancelledBy, refundAmount = 0) {
  if (this.status === 'DELIVERED' || this.status === 'CANCELLED') {
    throw new Error('Cannot cancel delivered or already cancelled order');
  }
  
  this.status = 'CANCELLED';
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date(),
    refundAmount
  };
  
  this.timeline.push({
    status: 'CANCELLED',
    timestamp: new Date(),
    note: `Order cancelled: ${reason}`,
    updatedBy: cancelledBy
  });
  
  return this.save();
};

// Instance method to clean up duplicate timeline entries
orderSchema.methods.cleanupTimeline = function() {
  const cleanedTimeline = [];
  let lastStatus = null;
  
  for (const entry of this.timeline) {
    // Only add if it's a different status or if it's the first entry
    if (lastStatus !== entry.status) {
      cleanedTimeline.push(entry);
      lastStatus = entry.status;
    }
  }
  
  this.timeline = cleanedTimeline;
  return this;
};

// Static method to find by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Static method to find by restaurant
orderSchema.statics.findByRestaurant = function(restaurantId, options = {}) {
  const query = { restaurantId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStatistics = function(restaurantId, dateFrom, dateTo) {
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
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$amount.total' },
        averageOrderValue: { $avg: '$amount.total' },
        statusCounts: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        completedOrders: 1,
        totalRevenue: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 0] },
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedOrders', '$totalOrders'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
