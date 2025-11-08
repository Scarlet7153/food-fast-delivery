const Joi = require('joi');

// Validation schemas
const schemas = {
  createOrder: Joi.object({
    restaurantId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().required(),
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        quantity: Joi.number().min(1).required(),
        totalPrice: Joi.number().min(0).required(),
        specialInstructions: Joi.string().max(200).allow('').optional()
      })
    ).min(1).required(),
    amount: Joi.object({
      subtotal: Joi.number().min(0).required(),
      deliveryFee: Joi.number().min(0).required(),
      tax: Joi.number().min(0).optional(),
      discount: Joi.number().min(0).optional(),
      total: Joi.number().min(0).required(),
      currency: Joi.string().default('VND').optional()
    }).required(),
    payment: Joi.object({
      method: Joi.string().valid('MOMO').default('MOMO').optional()
    }).optional(),
    deliveryAddress: Joi.object({
      text: Joi.string().min(10).max(200).required(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).required()
      }).required(),
      contactPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
      contactName: Joi.string().optional(),
      notes: Joi.string().max(200).allow('').optional()
    }).required()
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(
      'PLACED',
      'CONFIRMED',
      'COOKING',
      'READY_FOR_PICKUP',
      'IN_FLIGHT',
      'DELIVERED',
      'CANCELLED',
      'FAILED'
    ).required(),
    note: Joi.string().max(200).allow('').optional()
  }),

  cancelOrder: Joi.object({
    reason: Joi.string().min(5).max(200).required()
  }),

  rateOrder: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).allow('').optional()
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
