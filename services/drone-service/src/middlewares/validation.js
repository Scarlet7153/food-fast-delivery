const Joi = require('joi');

// Validation schemas
const schemas = {
  createDrone: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    serialNumber: Joi.string().max(50).optional(),
    model: Joi.string().max(50).required(),
    maxPayloadGrams: Joi.number().min(100).max(10000).required(),
    maxRangeMeters: Joi.number().min(100).max(50000).required(),
  // simplified model: omit maxFlightTime and detailed settings
  }),

  updateDrone: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    serialNumber: Joi.string().max(50).optional(),
    model: Joi.string().max(50).optional(),
    maxPayloadGrams: Joi.number().min(100).max(10000).optional(),
    // Align min range with model's min (100 meters)
    maxRangeMeters: Joi.number().min(100).max(50000).optional(),

    // Immutable / internal fields should not be updated via this endpoint
    restaurantId: Joi.forbidden(),
    status: Joi.forbidden(),
    currentLocation: Joi.forbidden(),
    currentMission: Joi.forbidden(),
    createdAt: Joi.forbidden(),
    updatedAt: Joi.forbidden(),
    _id: Joi.forbidden()
  // simplified model: omit maxFlightTime and detailed settings
  }).or('name', 'serialNumber', 'model', 'maxPayloadGrams', 'maxRangeMeters'),

  updateDroneStatus: Joi.object({
    status: Joi.string().valid('IDLE', 'BUSY').required()
  }),

  updateDroneLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }),

  scheduleMaintenance: Joi.object({
    daysFromNow: Joi.number().min(1).max(365).optional()
  }),

  createMission: Joi.object({
    orderId: Joi.string().required(),
    droneId: Joi.string().required()
  }),

  updateMissionStatus: Joi.object({
    status: Joi.string().valid(
      'QUEUED',
      'PREPARING',
      'TAKEOFF',
      'CRUISING',
      'APPROACHING',
      'LANDING',
      'DELIVERED',
      'RETURNING',
      'COMPLETED',
      'ABORTED',
      'FAILED'
    ).required(),
    note: Joi.string().max(200).optional()
  }),

  addPathPoint: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    altitude: Joi.number().min(0).max(1000).optional(),
    heading: Joi.number().min(0).max(360).optional(),
  speed: Joi.number().min(0).max(200).optional()
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
        // Vietnamese: Validation failed
        error: 'Dữ liệu không hợp lệ',
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
