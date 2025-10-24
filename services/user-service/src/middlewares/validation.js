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
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
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
    address: Joi.object({
      text: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).optional()
      }).optional()
    }).optional()
  }),

  // Admin schemas
  updateUser: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    role: Joi.string().valid('customer', 'restaurant', 'admin').optional(),
    active: Joi.boolean().optional(),
    address: Joi.object({
      text: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).optional()
      }).optional()
    }).optional()
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