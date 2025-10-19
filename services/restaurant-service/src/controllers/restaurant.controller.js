const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, minRating, maxDistance, longitude, latitude } = req.query;
    
    let query = { active: true, approved: true };
    
    // Text search
    if (search) {
      query.$text = { $search: search };
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
        .sort({ 'rating.average': -1, name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }
    
    const total = await Restaurant.countDocuments(query);
    
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
    
    // Get menu items
    const menuItems = await MenuItem.findByRestaurant(id);
    
    res.json({
      success: true,
      data: {
        restaurant,
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

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantByOwner,
  createRestaurant,
  updateRestaurant,
  approveRestaurant,
  getPendingRestaurants,
  calculateDeliveryFee,
  updateRating
};
