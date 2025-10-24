const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).when('role', {
      is: 'restaurant',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'string.pattern.base': 'Phone number format is invalid',
      'any.required': 'Phone is required for restaurant registration'
    }),
    address: Joi.object({
      text: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).optional()
      }).optional()
    }).optional(),
    role: Joi.string().valid('customer', 'restaurant', 'admin').required(),
    // Restaurant-specific fields
    restaurantName: Joi.string().min(2).max(100).when('role', {
      is: 'restaurant',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    restaurantAddress: Joi.string().min(10).max(200).when('role', {
      is: 'restaurant',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    restaurantPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).when('role', {
      is: 'restaurant',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    restaurantDescription: Joi.string().max(500).allow('').optional(),
    imageUrl: Joi.string().allow('').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu mới là bắt buộc'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  // User management schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    address: Joi.alternatives().try(
      Joi.string().allow('').optional(),
      Joi.object({
        text: Joi.string().optional(),
        location: Joi.object({
          type: Joi.string().valid('Point').default('Point'),
          coordinates: Joi.array().items(Joi.number()).length(2).optional()
        }).optional()
      }).optional()
    )
  }),

  // Admin schemas
  updateUser: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    role: Joi.string().valid('customer', 'restaurant', 'admin').optional(),
    active: Joi.boolean().optional(),
    address: Joi.alternatives().try(
      Joi.string().allow('').optional(),
      Joi.object({
        text: Joi.string().optional(),
        location: Joi.object({
          type: Joi.string().valid('Point').default('Point'),
          coordinates: Joi.array().items(Joi.number()).length(2).optional()
        }).optional()
      }).optional()
    )
  }),

  updateUserStatus: Joi.object({
    active: Joi.boolean().required()
  }),

  // Refresh token management schemas
  addRefreshToken: Joi.object({
    token: Joi.string().required()
  }),

  removeRefreshToken: Joi.object({
    token: Joi.string().required()
  }),

  validateRefreshToken: Joi.object({
    token: Joi.string().required()
  }),

  // Payment info schema
  paymentInfo: Joi.object({
    contactInfo: Joi.object({
      name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Họ tên phải có ít nhất 2 ký tự',
        'string.max': 'Họ tên không được quá 50 ký tự',
        'any.required': 'Họ tên là bắt buộc'
      }),
      phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required().messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ',
        'any.required': 'Số điện thoại là bắt buộc'
      })
    }).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().min(5).max(200).required().messages({
        'string.min': 'Địa chỉ đường phải có ít nhất 5 ký tự',
        'string.max': 'Địa chỉ đường không được quá 200 ký tự',
        'any.required': 'Địa chỉ đường là bắt buộc'
      }),
      city: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Thành phố phải có ít nhất 2 ký tự',
        'string.max': 'Thành phố không được quá 50 ký tự',
        'any.required': 'Thành phố là bắt buộc'
      }),
      district: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Quận/Huyện phải có ít nhất 2 ký tự',
        'string.max': 'Quận/Huyện không được quá 50 ký tự',
        'any.required': 'Quận/Huyện là bắt buộc'
      }),
      ward: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Phường/Xã phải có ít nhất 2 ký tự',
        'string.max': 'Phường/Xã không được quá 50 ký tự',
        'any.required': 'Phường/Xã là bắt buộc'
      })
    }).required(),
    isDefault: Joi.boolean().optional()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  schemas
};