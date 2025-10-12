const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.details
      });
    }

    req[property] = value;
    next();
  };
};

// Common validation schemas
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
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional().messages({
      'string.pattern.base': 'Phone number must be 10-11 digits'
    }),
    role: Joi.string().valid('customer', 'restaurant').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Restaurant schemas
  restaurant: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(10).max(200).required(),
    location: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    momo: Joi.object({
      partnerCode: Joi.string().required(),
      accessKey: Joi.string().required(),
      secretKey: Joi.string().required()
    }).optional()
  }),

  // Restaurant update schema (location not required for updates)
  restaurantUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    address: Joi.string().min(10).max(200).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
    email: Joi.string().email().optional(),
    imageUrl: Joi.string().uri().optional(),
    deliverySettings: Joi.object({
      baseRate: Joi.number().min(0).optional(),
      perKmRate: Joi.number().min(0).optional(),
      estimatedTime: Joi.string().optional(),
      maxDistance: Joi.number().min(0).optional()
    }).optional(),
    operatingHours: Joi.object({
      monday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      tuesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      wednesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      thursday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      friday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      saturday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional(),
      sunday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      }).optional()
    }).optional()
  }),

  // Menu item schemas
  menuItem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    category: Joi.string().max(50).optional(),
    available: Joi.boolean().default(true),
    weightGrams: Joi.number().min(1).max(5000).optional()
  }),

  // Order schemas
  order: Joi.object({
    restaurantId: Joi.string().hex().length(24).required(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required()
      })
    ).min(1).required(),
    deliveryAddress: Joi.object({
      text: Joi.string().min(10).max(200).required(),
      location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required()
      }).required()
    }).required()
  }),

  // Drone schemas
  drone: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    model: Joi.string().min(2).max(50).required(),
    serial: Joi.string().min(5).max(20).optional(), // Make optional since frontend doesn't send it
    maxPayloadGrams: Joi.number().min(100).max(10000).required(),
    maxRangeMeters: Joi.number().min(1000).max(50000).required(),
    status: Joi.string().valid('IDLE', 'CHARGING', 'MAINTENANCE', 'IN_FLIGHT', 'ERROR').optional(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional(),
    geofence: Joi.object({
      center: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      }).required(),
      radiusMeters: Joi.number().min(100).max(10000).required()
    }).required()
  }),

  // Mission schemas
  mission: Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    droneId: Joi.string().hex().length(24).required()
  }),

  // Payment schemas
  payment: Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    method: Joi.string().valid('MOMO').required(),
    amount: Joi.number().min(1000).required()
  }),

  // Common schemas
  objectId: Joi.string().hex().length(24).required(),
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Location schemas
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  })
};

module.exports = {
  validate,
  schemas
};

