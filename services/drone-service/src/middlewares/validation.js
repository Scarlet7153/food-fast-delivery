const Joi = require('joi');

// Validation schemas
const schemas = {
  createDrone: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    serialNumber: Joi.string().max(50).optional(),
    model: Joi.string().max(50).optional(),
    maxPayloadGrams: Joi.number().min(100).max(10000).optional(),
    maxRangeMeters: Joi.number().min(1000).max(50000).optional(),
    maxFlightTimeMinutes: Joi.number().min(5).max(120).optional(),
    settings: Joi.object({
      autoReturn: Joi.boolean().optional(),
      lowBatteryThreshold: Joi.number().min(5).max(50).optional(),
      maxFlightTime: Joi.number().min(5).max(120).optional(),
      emergencyLanding: Joi.boolean().optional()
    }).optional()
  }),

  updateDrone: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    serialNumber: Joi.string().max(50).optional(),
    model: Joi.string().max(50).optional(),
    maxPayloadGrams: Joi.number().min(100).max(10000).optional(),
    maxRangeMeters: Joi.number().min(1000).max(50000).optional(),
    maxFlightTimeMinutes: Joi.number().min(5).max(120).optional(),
    settings: Joi.object({
      autoReturn: Joi.boolean().optional(),
      lowBatteryThreshold: Joi.number().min(5).max(50).optional(),
      maxFlightTime: Joi.number().min(5).max(120).optional(),
      emergencyLanding: Joi.boolean().optional()
    }).optional()
  }),

  updateDroneStatus: Joi.object({
    status: Joi.string().valid('IDLE', 'CHARGING', 'MAINTENANCE', 'IN_FLIGHT', 'ERROR').required()
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
    speed: Joi.number().min(0).max(200).optional(),
    batteryPercent: Joi.number().min(0).max(100).optional()
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
