const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    role: Joi.string().valid('customer', 'restaurant', 'admin').default('customer'),
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
    restaurantDescription: Joi.string().max(500).optional(),
    imageUrl: Joi.string().uri().optional()
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
    newPassword: Joi.string().min(6).required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).optional()
      }).optional()
    }).optional()
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
