const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'admin'],
    default: 'customer'
  },
  active: {
    type: Boolean,
    default: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  address: {
    text: String,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    }
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentInfo: [{
    contactInfo: {
      name: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      }
    },
    deliveryAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      district: {
        type: String,
        required: true
      },
      ward: {
        type: String,
        required: true
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ restaurantId: 1 });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ 'address.location': '2dsphere' }, { sparse: true });

// Virtual for restaurant info (for restaurant users)
userSchema.virtual('restaurant', {
  ref: 'Restaurant',
  localField: 'restaurantId',
  foreignField: '_id',
  justOne: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Convert to summary (without sensitive data)
userSchema.methods.toSummary = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
