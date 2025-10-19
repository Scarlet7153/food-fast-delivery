const Joi = require('joi');

// Validation schemas
const schemas = {
  sendNotification: Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().valid(
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
    ).required(),
    title: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(500).required(),
    data: Joi.object().optional(),
    channels: Joi.array().items(
      Joi.string().valid('IN_APP', 'PUSH', 'EMAIL', 'SMS')
    ).min(1).optional(),
    priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional()
  }),

  sendOrderStatusNotification: Joi.object({
    orderId: Joi.string().required(),
    userId: Joi.string().required(),
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
    orderNumber: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required(),
        totalPrice: Joi.number().min(0).required()
      })
    ).required(),
    total: Joi.number().min(0).required(),
    estimatedDeliveryTime: Joi.date().optional()
  }),

  sendPaymentNotification: Joi.object({
    userId: Joi.string().required(),
    orderId: Joi.string().required(),
    orderNumber: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    status: Joi.string().valid('SUCCESS', 'FAILED').required(),
    paymentMethod: Joi.string().valid('MOMO', 'COD', 'BANK_TRANSFER', 'CREDIT_CARD').required()
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
