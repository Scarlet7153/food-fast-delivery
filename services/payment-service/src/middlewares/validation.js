const Joi = require('joi');

// Validation schemas
const schemas = {
  createPayment: Joi.object({
    orderId: Joi.string().required(),
    method: Joi.string().valid('MOMO').default('MOMO').optional()
  }),

  processRefund: Joi.object({
    paymentId: Joi.string().required(),
    amount: Joi.number().min(0).optional(),
    reason: Joi.string().min(5).max(200).required()
  }),

  processPaymentCallback: Joi.object({
    orderId: Joi.string().required(),
    resultCode: Joi.number().required(),
    transId: Joi.string().required(),
    amount: Joi.number().required(),
    orderInfo: Joi.string().required(),
    responseTime: Joi.string().required(),
    extraData: Joi.string().optional(),
    signature: Joi.string().required()
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
