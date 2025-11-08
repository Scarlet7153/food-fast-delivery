const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');
const { removeVietnameseAccents } = require('../utils/helpers');

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, category, minRating, maxDistance, longitude, latitude, status } = req.query;
    
    // If user is admin, show all restaurants. Otherwise, only show active and approved
    let query = {};
    if (!req.user || req.user.role !== 'admin') {
      query = { active: true, approved: true };
    }
    
    // Status filter (for admin)
    if (status && req.user && req.user.role === 'admin') {
      if (status === 'pending') {
        query.approved = false;
      } else if (status === 'approved') {
        query.approved = true;
        query.active = true;
      } else if (status === 'rejected') {
        query.approved = false;
        query.rejectionReason = { $exists: true };
      } else if (status === 'suspended') {
        query.active = false;
      }
    }
    
    // Text search - flexible Vietnamese search
    if (search) {
      // Create a flexible search that matches both accented and non-accented text
      const chars = search.split('');
      const flexiblePattern = chars.map(char => {
        // Create pattern that matches the character with or without accents
        if ('aàáạảãâầấậẩẫăằắặẳẵ'.includes(char.toLowerCase())) return '[aàáạảãâầấậẩẫăằắặẳẵ]';
        if ('eèéẹẻẽêềếệểễ'.includes(char.toLowerCase())) return '[eèéẹẻẽêềếệểễ]';
        if ('iìíịỉĩ'.includes(char.toLowerCase())) return '[iìíịỉĩ]';
        if ('oòóọỏõôồốộổỗơờớợởỡ'.includes(char.toLowerCase())) return '[oòóọỏõôồốộổỗơờớợởỡ]';
        if ('uùúụủũưừứựửữ'.includes(char.toLowerCase())) return '[uùúụủũưừứựửữ]';
        if ('yỳýỵỷỹ'.includes(char.toLowerCase())) return '[yỳýỵỷỹ]';
        if ('dđ'.includes(char.toLowerCase())) return '[dđ]';
        return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }).join('');
      
      const searchRegex = new RegExp(flexiblePattern, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    let restaurants;
    
    // Location-based search
    if (longitude && latitude && maxDistance) {
      restaurants = await Restaurant.findNearby(
        parseFloat(longitude), 
        parseFloat(latitude), 
        parseFloat(maxDistance)
      );
    } else {
      restaurants = await Restaurant.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }
    
    // Add computed status field to each restaurant and fetch owner emails if needed
    const restaurantsWithStatus = await Promise.all(restaurants.map(async (restaurant) => {
      const rest = restaurant.toObject();
      
      // Determine status based on approved and active fields
      if (!rest.approved && rest.rejectionReason) {
        rest.status = 'rejected';
      } else if (!rest.approved) {
        rest.status = 'pending';
      } else if (rest.approved && !rest.active) {
        rest.status = 'suspended';
      } else {
        rest.status = 'approved';
      }
      
      // Fetch owner email if not present (for backwards compatibility)
      if (!rest.ownerEmail && rest.ownerUserId && req.user && req.user.role === 'admin') {
        try {
          const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/admin/users/${rest.ownerUserId}`, {
            headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
          });
          if (userResponse.data.success) {
            rest.ownerEmail = userResponse.data.data.user.email;
            // Update restaurant with email for future use
            await Restaurant.findByIdAndUpdate(rest._id, { ownerEmail: rest.ownerEmail });
          }
        } catch (error) {
          const status = error.response?.status;
          const data = error.response?.data;
          logger.warn(`Failed to fetch owner email for restaurant ${rest._id}:`, error.message, { status, data });
        }
      }
      
      return rest;
    }));
    
    const total = await Restaurant.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        restaurants: restaurantsWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get all restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants'
    });
  }
};

// Get restaurant by ID
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    // Convert to object and add status
    const restaurantObj = restaurant.toObject();
    if (!restaurantObj.approved && restaurantObj.rejectionReason) {
      restaurantObj.status = 'rejected';
    } else if (!restaurantObj.approved) {
      restaurantObj.status = 'pending';
    } else if (restaurantObj.approved && !restaurantObj.active) {
      restaurantObj.status = 'suspended';
    } else {
      restaurantObj.status = 'approved';
    }
    
    // Fetch owner information from user-service
    if (restaurantObj.ownerUserId) {
      try {
        const ownerResponse = await axios.get(`${config.USER_SERVICE_URL}/api/admin/users/${restaurantObj.ownerUserId}`, {
          headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
        });
        if (ownerResponse.data.success) {
          restaurantObj.owner = ownerResponse.data.data.user;
        }
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        logger.warn(`Failed to fetch owner info for restaurant ${id}:`, error.message, { status, data });
      }
    }
    
    // Get menu items
    const menuItems = await MenuItem.findByRestaurant(id);
    
    res.json({
      success: true,
      data: {
        restaurant: restaurantObj,
        menuItems
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant'
    });
  }
};

// Get restaurant by owner
const getRestaurantByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const restaurant = await Restaurant.findOne({ ownerUserId: ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant by owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant'
    });
  }
};

// Create restaurant
const createRestaurant = async (req, res) => {
  try {
    const restaurantData = req.body;
    
    // Check if owner already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerUserId: restaurantData.ownerUserId });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        error: 'User already has a restaurant'
      });
    }
    
    // Fetch owner email from user-service if not provided
    if (!restaurantData.ownerEmail && restaurantData.ownerUserId) {
      try {
        const userResponse = await axios.get(`${config.USER_SERVICE_URL}/api/admin/users/${restaurantData.ownerUserId}`);
        if (userResponse.data.success) {
          restaurantData.ownerEmail = userResponse.data.data.user.email;
        }
      } catch (error) {
        logger.warn(`Failed to fetch owner email for user ${restaurantData.ownerUserId}:`, error.message);
      }
    }
    
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    
    logger.info(`New restaurant created: ${restaurant.name} by user ${restaurantData.ownerUserId}`);
    
    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restaurant'
    });
  }
};

// Update restaurant
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    logger.info(`Restaurant updated: ${restaurant.name}`);
    
    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant'
    });
  }
};

// Approve restaurant (Admin only)
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { 
        approved,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        active: approved
      },
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    logger.info(`Restaurant ${approved ? 'approved' : 'rejected'}: ${restaurant.name}`);
    
    res.json({
      success: true,
      message: `Restaurant ${approved ? 'approved' : 'rejected'} successfully`,
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Approve restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant approval status'
    });
  }
};

// Get pending restaurants (Admin only)
const getPendingRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const restaurants = await Restaurant.findPendingApproval()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Restaurant.countDocuments({ approved: false });
    
    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get pending restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending restaurants'
    });
  }
};

// Calculate delivery fee
const calculateDeliveryFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { distanceKm } = req.body;
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const deliveryFee = restaurant.calculateDeliveryFee(distanceKm);
    
    if (deliveryFee === null) {
      return res.status(400).json({
        success: false,
        error: 'Delivery distance exceeds maximum allowed distance'
      });
    }
    
    res.json({
      success: true,
      data: {
        deliveryFee,
        maxDistance: restaurant.deliverySettings.maxDeliveryDistance
      }
    });
    
  } catch (error) {
    logger.error('Calculate delivery fee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate delivery fee'
    });
  }
};

// Update restaurant rating
const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    await restaurant.updateRating(rating);
    
    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update rating'
    });
  }
};

// Reject restaurant (Admin only)
const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { 
        approved: false,
        active: false,
        rejectionReason: reason || 'Application rejected by admin',
        rejectedAt: new Date()
      },
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: { restaurant },
      message: 'Restaurant rejected successfully'
    });
  } catch (error) {
    logger.error('Reject restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject restaurant'
    });
  }
};

// Get my restaurant (Restaurant owner)
const getMyRestaurant = async (req, res) => {
  try {
    // Handle both _id and userId from JWT token
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      logger.error('No user ID found in request');
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }
    
    const restaurant = await Restaurant.findOne({ ownerUserId: userId });
    
    if (!restaurant) {
      logger.warn(`Restaurant not found for user: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found for this user'
      });
    }
    
    // Add computed status
    const restaurantObj = restaurant.toObject();
    if (!restaurantObj.approved && restaurantObj.rejectionReason) {
      restaurantObj.status = 'rejected';
    } else if (!restaurantObj.approved) {
      restaurantObj.status = 'pending';
    } else if (restaurantObj.approved && !restaurantObj.active) {
      restaurantObj.status = 'suspended';
    } else {
      restaurantObj.status = 'approved';
    }
    
    res.json({
      success: true,
      data: {
        restaurant: restaurantObj
      }
    });
    
  } catch (error) {
    logger.error('Get my restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant',
      details: error.message
    });
  }
};

// Update my restaurant (Restaurant owner)
const updateMyRestaurant = async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user._id || req.user.userId;
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerUserId: userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: {
        restaurant
      }
    });
    
  } catch (error) {
    logger.error('Update my restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant',
      details: error.message
    });
  }
};

// Update restaurant status (Admin only)
const updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    
    const updateData = {};
    
    // Handle different actions
    switch (action) {
      case 'approve':
        updateData.approved = true;
        updateData.active = true;
        updateData.approvedBy = req.user._id;
        updateData.approvedAt = new Date();
        updateData.rejectionReason = undefined; // Clear rejection reason
        break;
        
      case 'reject':
        updateData.approved = false;
        updateData.active = false;
        updateData.rejectionReason = reason || 'Application rejected by admin';
        updateData.rejectedAt = new Date();
        break;
        
      case 'suspend':
        updateData.active = false;
        break;
        
      case 'activate':
        // Only activate if already approved
        const rest = await Restaurant.findById(id);
        if (rest && rest.approved) {
          updateData.active = true;
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    logger.info(`Restaurant status updated - Action: ${action}, Restaurant: ${restaurant.name}`);
    
    res.json({
      success: true,
      data: { restaurant },
      message: 'Restaurant status updated successfully'
    });
  } catch (error) {
    logger.error('Update restaurant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant status'
    });
  }
};

// Internal API - Get all restaurants (for service-to-service communication)
const getAllRestaurantsInternal = async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    
    // Return only approved restaurants for admin filters
    const restaurants = await Restaurant.find({ approved: true })
      .select('_id name')
      .limit(limit * 1)
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: {
        restaurants
      }
    });
    
  } catch (error) {
    logger.error('Get all restaurants (internal) error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants'
    });
  }
};

// Toggle restaurant open/close status (Restaurant owner only)
const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerUserId: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Check if restaurant is approved
    if (!restaurant.approved) {
      return res.status(403).json({
        success: false,
        error: 'Restaurant must be approved before opening'
      });
    }

    // Toggle the isOpen status
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    logger.info(`Restaurant ${restaurant.name} is now ${restaurant.isOpen ? 'OPEN' : 'CLOSED'}`);

    res.json({
      success: true,
      message: `Cửa hàng đã ${restaurant.isOpen ? 'mở cửa' : 'đóng cửa'}`,
      data: {
        restaurant,
        isOpen: restaurant.isOpen
      }
    });

  } catch (error) {
    logger.error('Toggle restaurant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle restaurant status'
    });
  }
};

module.exports = {
  getAllRestaurants,
  getAllRestaurantsInternal,
  getRestaurantById,
  getRestaurantByOwner,
  createRestaurant,
  updateRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  approveRestaurant,
  rejectRestaurant,
  updateRestaurantStatus,
  getPendingRestaurants,
  calculateDeliveryFee,
  updateRating,
  toggleRestaurantStatus
};
