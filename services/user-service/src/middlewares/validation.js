const Joi = require('joi');

// Validation schemas
const schemas = {
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
  }),

  updateUserStatus: Joi.object({
    active: Joi.boolean().required()
  }),

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
