const Joi = require('joi');

// Validation schemas
const schemas = {
  createRestaurant: Joi.object({
    ownerUserId: Joi.string().required(),
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    address: Joi.string().min(10).max(200).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    email: Joi.string().email().allow('').optional(),
    imageUrl: Joi.string().uri().allow('').optional(),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).optional()
    }).optional(),
    approved: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    deliverySettings: Joi.object({
      baseRate: Joi.number().min(0).optional(),
      ratePerKm: Joi.number().min(0).optional(),
      maxDeliveryDistance: Joi.number().min(1).optional(),
      estimatedPrepTime: Joi.number().min(5).max(120).optional()
    }).optional(),
    operatingHours: Joi.object({
      monday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      tuesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      wednesday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      thursday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      friday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      saturday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional(),
      sunday: Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closed: Joi.boolean().optional()
      }).optional()
    }).optional()
  }),

  updateRestaurant: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    address: Joi.string().min(10).max(200).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
    email: Joi.string().email().optional(),
    imageUrl: Joi.string().uri().optional(),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).optional()
    }).optional(),
    deliverySettings: Joi.object({
      baseRate: Joi.number().min(0).optional(),
      ratePerKm: Joi.number().min(0).optional(),
      maxDeliveryDistance: Joi.number().min(1).optional(),
      estimatedPrepTime: Joi.number().min(5).max(120).optional()
    }).optional()
  }),

  approveRestaurant: Joi.object({
    approved: Joi.boolean().required()
  }),

  calculateDeliveryFee: Joi.object({
    distanceKm: Joi.number().min(0).required()
  }),

  updateRating: Joi.object({
    rating: Joi.number().min(1).max(5).required()
  }),

  createMenuItem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    originalPrice: Joi.number().min(0).optional(),
    imageUrl: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().optional()
    })).optional(),
    category: Joi.string().min(2).max(50).required(),
    available: Joi.boolean().optional(),
    featured: Joi.boolean().optional(),
    weightGrams: Joi.number().min(1).max(5000).optional(),
    nutrition: Joi.object({
      calories: Joi.number().min(0).optional(),
      protein: Joi.number().min(0).optional(),
      carbs: Joi.number().min(0).optional(),
      fat: Joi.number().min(0).optional(),
      fiber: Joi.number().min(0).optional(),
      sodium: Joi.number().min(0).optional()
    }).optional(),
    allergens: Joi.array().items(Joi.string().valid('gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'sesame')).optional(),
    dietary: Joi.array().items(Joi.string().valid('vegetarian', 'vegan', 'halal', 'kosher', 'keto', 'low-carb', 'dairy-free', 'gluten-free')).optional(),
    prepTimeMinutes: Joi.number().min(1).max(120).optional(),
    inventory: Joi.object({
      trackInventory: Joi.boolean().optional(),
      stockQuantity: Joi.number().min(0).optional(),
      lowStockThreshold: Joi.number().min(0).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
    searchKeywords: Joi.array().items(Joi.string().trim().lowercase()).optional()
  }),

  updateMenuItem: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).optional(),
    originalPrice: Joi.number().min(0).optional(),
    imageUrl: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().optional()
    })).optional(),
    category: Joi.string().min(2).max(50).optional(),
    available: Joi.boolean().optional(),
    featured: Joi.boolean().optional(),
    weightGrams: Joi.number().min(1).max(5000).optional(),
    nutrition: Joi.object({
      calories: Joi.number().min(0).optional(),
      protein: Joi.number().min(0).optional(),
      carbs: Joi.number().min(0).optional(),
      fat: Joi.number().min(0).optional(),
      fiber: Joi.number().min(0).optional(),
      sodium: Joi.number().min(0).optional()
    }).optional(),
    allergens: Joi.array().items(Joi.string().valid('gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'sesame')).optional(),
    dietary: Joi.array().items(Joi.string().valid('vegetarian', 'vegan', 'halal', 'kosher', 'keto', 'low-carb', 'dairy-free', 'gluten-free')).optional(),
    prepTimeMinutes: Joi.number().min(1).max(120).optional(),
    inventory: Joi.object({
      trackInventory: Joi.boolean().optional(),
      stockQuantity: Joi.number().min(0).optional(),
      lowStockThreshold: Joi.number().min(0).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
    searchKeywords: Joi.array().items(Joi.string().trim().lowercase()).optional()
  }),

  updateStock: Joi.object({
    quantity: Joi.number().required()
  }),

  updateMenuItemRating: Joi.object({
    rating: Joi.number().min(1).max(5).required()
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
