const User = require('../models/User');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If restaurant owner, get restaurant info
    if (user.role === 'restaurant') {
      try {
        const response = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${user._id}`);
        user.restaurant = response.data.data.restaurant;
      } catch (error) {
        logger.warn(`Restaurant not found for user ${user._id}`);
      }
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) {
      updateData.address = address;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-refreshTokens');

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-refreshTokens')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Update user status (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { active },
      { new: true, runValidators: true }
    ).select('-refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If deactivating user, remove all refresh tokens
    if (!active) {
      user.refreshTokens = [];
      await user.save();
    }

    logger.info(`User status updated: ${user.email} - ${active ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      message: `User ${active ? 'activated' : 'deactivated'} successfully`,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
};

// Add refresh token
const addRefreshToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove old refresh tokens (keep only last 5)
    user.refreshTokens = user.refreshTokens.slice(-4);
    
    // Add new refresh token
    user.refreshTokens.push({ token });
    
    await user.save();

    res.json({
      success: true,
      message: 'Refresh token added successfully'
    });

  } catch (error) {
    logger.error('Add refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add refresh token'
    });
  }
};

// Remove refresh token
const removeRefreshToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== token
    );
    
    await user.save();

    res.json({
      success: true,
      message: 'Refresh token removed successfully'
    });

  } catch (error) {
    logger.error('Remove refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove refresh token'
    });
  }
};

// Remove all refresh tokens
const removeAllRefreshTokens = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'All refresh tokens removed successfully'
    });

  } catch (error) {
    logger.error('Remove all refresh tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove all refresh tokens'
    });
  }
};

// Validate refresh token
const validateRefreshToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.json({
        valid: false
      });
    }

    const isValid = user.refreshTokens.some(tokenObj => tokenObj.token === token);

    res.json({
      valid: isValid
    });

  } catch (error) {
    logger.error('Validate refresh token error:', error);
    res.json({
      valid: false
    });
  }
};

// Get user by ID (for other services)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-refreshTokens');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  addRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  validateRefreshToken,
  getUserById
};
