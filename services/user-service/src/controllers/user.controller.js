const User = require('../models/User');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

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
    if (address !== undefined) {
      // Handle both string and object formats for address
      if (typeof address === 'string') {
        updateData.address = { text: address };
      } else if (typeof address === 'object' && address !== null) {
        updateData.address = address;
      } else {
        updateData.address = null;
      }
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
    const { page = 1, limit = 100, role, search, status } = req.query;
    
    const query = {};
    if (role) query.role = role;
    
    // Handle status filter
    if (status) {
      if (status === 'active') {
        query.active = true;
      } else if (status === 'suspended') {
        query.active = false;
      }
      // 'pending' status would need additional logic if implemented
    }
    
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

    // Add computed status field to each user
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      userObj.status = userObj.active ? 'active' : 'suspended';
      userObj.lastActiveAt = userObj.lastLogin || userObj.updatedAt;
      return userObj;
    });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: usersWithStatus,
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
    const { action, reason } = req.body;

    let updateData = {};
    
    // Handle different actions
    switch (action) {
      case 'activate':
        updateData.active = true;
        break;
      case 'suspend':
        updateData.active = false;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If deactivating user, remove all refresh tokens
    if (!user.active) {
      user.refreshTokens = [];
      await user.save();
    }

    logger.info(`User status updated: ${user.email} - ${action} - Reason: ${reason || 'N/A'}`);

    // Add status field to response
    const userObj = user.toObject();
    userObj.status = userObj.active ? 'active' : 'suspended';

    res.json({
      success: true,
      message: `User ${action === 'activate' ? 'activated' : 'suspended'} successfully`,
      data: {
        user: userObj
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

// Check if phone is available (for registration validation)
const checkPhoneAvailability = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const existingUser = await User.findOne({ phone: phone.trim() });
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? 'Số điện thoại này đã được đăng ký' : 'Số điện thoại khả dụng'
      }
    });

  } catch (error) {
    logger.error('Check phone availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone availability'
    });
  }
};

// Check if email is available (for registration validation)
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? 'Email này đã được sử dụng' : 'Email khả dụng'
      }
    });

  } catch (error) {
    logger.error('Check email availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability'
    });
  }
};

// Register new user
const register = async (req, res) => {
  try {
    logger.info('Registration request received:', { 
      email: req.body.email, 
      role: req.body.role,
      hasRestaurantName: !!req.body.restaurantName,
      hasRestaurantPhone: !!req.body.restaurantPhone,
      phone: req.body.phone,
      restaurantPhone: req.body.restaurantPhone
    });
    
    const { 
      name, email, password, phone, address, role = 'customer',
      // Restaurant-specific fields
      restaurantName, restaurantAddress, restaurantPhone, 
      restaurantDescription, imageUrl 
    } = req.body;

    // Check if user already exists (by email or phone)
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { phone }
      ]
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          error: 'Email này đã được sử dụng'
        });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          error: 'Số điện thoại này đã được đăng ký'
        });
      }
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role
    });

    await user.save();

    // If restaurant role, create restaurant profile (pending approval)
    if (role === 'restaurant') {
      try {
        const restaurantData = {
          ownerUserId: user._id,
          name: restaurantName || `${name}'s Restaurant`,
          address: restaurantAddress || 'Please update restaurant address',
          phone: restaurantPhone || phone,
          description: restaurantDescription || '',
          imageUrl: imageUrl || '',
          approved: false,  // Restaurant needs admin approval
          active: false     // Restaurant will be activated after admin approval
        };

        logger.info(`Creating restaurant with data:`, restaurantData);
        await axios.post(`${config.RESTAURANT_SERVICE_URL}/api/restaurants`, restaurantData);
        logger.info(`New restaurant registered (pending approval): ${user.email} - ${restaurantName}`);
      } catch (restaurantError) {
        logger.error('Failed to create restaurant:', restaurantError);
        // If restaurant creation fails, delete the user
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create restaurant profile'
        });
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    logger.info(`New user registered: ${email}`);

    // For restaurant, return success without tokens (they can't login until approved)
    if (role === 'restaurant') {
      return res.status(201).json({
        success: true,
        message: 'Restaurant registered successfully. Please wait for admin approval.',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản đã bị khóa'
      });
    }

    // Check if restaurant is approved (for restaurant owners)
    if (user.role === 'restaurant') {
      try {
        logger.info(`Checking restaurant approval for user ${user._id}`);
        const response = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${user._id}`);
        const restaurant = response.data.data.restaurant;
        
        logger.info(`Restaurant found: ${restaurant ? 'Yes' : 'No'}, Approved: ${restaurant?.approved}`);
        
        if (restaurant && !restaurant.approved) {
          logger.info(`Restaurant ${restaurant.name} is pending approval for user ${user._id}`);
          return res.status(401).json({
            success: false,
            error: 'Nhà hàng của bạn đang chờ xét duyệt. Vui lòng chờ admin phê duyệt.',
            data: { pendingApproval: true }
          });
        }
      } catch (error) {
        // If restaurant not found, allow login but user won't have restaurant access
        logger.warn(`Restaurant not found for user ${user._id}:`, error.message);
        // If restaurant creation failed during registration, allow login
        // User can contact admin to create restaurant manually
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Đăng nhập thất bại'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

  // Validate refresh token format first
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.split('.').length !== 3) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token format'
    });
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id);

    if (refreshToken) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    }

    await user.save();

    logger.info(`User logged out: ${user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshTokens = [];
    await user.save();

    logger.info(`User logged out from all devices: ${user.email}`);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices'
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    logger.info(`Password reset token generated for: ${email}`);

    res.json({
      success: true,
      message: 'Password reset token sent to email',
      data: {
        resetToken // In production, don't send this in response
      }
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process forgot password request'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update user (password will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = []; // Invalidate all refresh tokens
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
};

// Verify token (for API Gateway)
const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-refreshTokens');

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu mới không được giống mật khẩu hiện tại'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all refresh tokens
    await user.save();

    logger.info(`Password changed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể đổi mật khẩu'
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role, active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address !== undefined) {
      // Handle both string and object formats for address
      if (typeof address === 'string') {
        updateData.address = { text: address };
      } else if (typeof address === 'object' && address !== null) {
        updateData.address = address;
      } else {
        updateData.address = null;
      }
    }
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User updated by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User deleted by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

// Get user statistics (Admin only)
const getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const customerCount = await User.countDocuments({ role: 'customer' });
    const restaurantCount = await User.countDocuments({ role: 'restaurant' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          customerCount,
          restaurantCount,
          adminCount
        }
      }
    });

  } catch (error) {
    logger.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics'
    });
  }
};

// Get admin dashboard stats (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    // Calculate date range based on timeRange parameter
    let startDate, endDate;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      customerCount,
      restaurantCount,
      adminCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'restaurant' }),
      User.countDocuments({ role: 'admin' })
    ]);

    // Get data from other services
    let activeRestaurants = 0;
    let totalOrders = 0;
    let completedOrders = 0;
    let inProgressOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;
    let platformRevenue = 0;
    let dronesInFlight = 0;
    let dronesIdle = 0;
    let dronesMaintenance = 0;
    let recentActivity = [];

    try {
      // Get restaurant statistics
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/admin/restaurants/stats`, {
        headers: { Authorization: req.headers.authorization }
      });
      if (restaurantResponse.data.success) {
        activeRestaurants = restaurantResponse.data.data.activeRestaurants || 0;
      }
    } catch (error) {
      logger.warn('Failed to get restaurant stats:', error.message);
    }

    try {
      // Get order statistics
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/admin/orders/stats?timeRange=${timeRange}`, {
        headers: { Authorization: req.headers.authorization }
      });
      if (orderResponse.data.success) {
        const stats = orderResponse.data.data.statistics;
        totalOrders = stats.totalOrders || 0;
        completedOrders = stats.completedOrders || 0;
        inProgressOrders = stats.inProgressOrders || 0;
        pendingOrders = stats.pendingOrders || 0;
        cancelledOrders = stats.cancelledOrders || 0;
        platformRevenue = stats.totalRevenue || 0;
      }
    } catch (error) {
      logger.warn('Failed to get order stats:', error.message);
    }

    try {
      // Get drone statistics
      const droneResponse = await axios.get(`${config.DRONE_SERVICE_URL}/api/admin/drones/stats`, {
        headers: { Authorization: req.headers.authorization }
      });
      if (droneResponse.data.success) {
        const stats = droneResponse.data.data.statistics;
        dronesInFlight = stats.inFlightDrones || 0;
        dronesIdle = stats.activeDrones || 0;
        dronesMaintenance = stats.maintenanceDrones || 0;
      }
    } catch (error) {
      logger.warn('Failed to get drone stats:', error.message);
    }

    try {
      // Get recent activity
      const activityResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/admin/orders/recent?limit=10`, {
        headers: { Authorization: req.headers.authorization }
      });
      if (activityResponse.data.success) {
        recentActivity = activityResponse.data.data.orders || [];
      }
    } catch (error) {
      logger.warn('Failed to get recent activity:', error.message);
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeRestaurants,
          totalOrders,
          completedOrders,
          inProgressOrders,
          pendingOrders,
          cancelledOrders,
          platformRevenue,
          dronesInFlight,
          dronesIdle,
          dronesMaintenance,
          activeConnections: 42 // Mock value
        },
        recentActivity
      }
    });

  } catch (error) {
    logger.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard stats'
    });
  }
};

// Payment Info Controllers
const getPaymentInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('paymentInfo');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        paymentInfo: user.paymentInfo || []
      }
    });

  } catch (error) {
    logger.error('Get payment info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment info'
    });
  }
};

const createPaymentInfo = async (req, res) => {
  try {
    const { contactInfo, deliveryAddress, isDefault } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If setting as default, unset all other defaults
    if (isDefault) {
      user.paymentInfo.forEach(info => {
        info.isDefault = false;
      });
    }

    const newPaymentInfo = {
      _id: new mongoose.Types.ObjectId(),
      contactInfo,
      deliveryAddress,
      isDefault: isDefault || false,
      createdAt: new Date()
    };

    user.paymentInfo.push(newPaymentInfo);
    await user.save();

    logger.info(`Payment info created for user: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Thông tin giao hàng đã được thêm thành công',
      data: {
        paymentInfo: newPaymentInfo
      }
    });

  } catch (error) {
    logger.error('Create payment info error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể thêm thông tin giao hàng'
    });
  }
};

const updatePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactInfo, deliveryAddress, isDefault } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find the payment info to update
    const paymentInfoIndex = user.paymentInfo.findIndex(info => info._id.toString() === id);
    
    if (paymentInfoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Payment info not found'
      });
    }

    // If setting as default, unset all other defaults
    if (isDefault) {
      user.paymentInfo.forEach(info => {
        info.isDefault = false;
      });
    }

    // Update the payment info
    user.paymentInfo[paymentInfoIndex].contactInfo = contactInfo;
    user.paymentInfo[paymentInfoIndex].deliveryAddress = deliveryAddress;
    user.paymentInfo[paymentInfoIndex].isDefault = isDefault || false;
    user.paymentInfo[paymentInfoIndex].updatedAt = new Date();

    await user.save();

    logger.info(`Payment info updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Thông tin giao hàng đã được cập nhật thành công',
      data: {
        paymentInfo: user.paymentInfo[paymentInfoIndex]
      }
    });

  } catch (error) {
    logger.error('Update payment info error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật thông tin giao hàng'
    });
  }
};

const deletePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find the index of the payment info to delete
    const paymentInfoIndex = user.paymentInfo.findIndex(info => info._id.toString() === id);
    
    if (paymentInfoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Payment info not found'
      });
    }

    // Remove the payment info from the array
    user.paymentInfo.splice(paymentInfoIndex, 1);
    await user.save();

    logger.info(`Payment info deleted for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Thông tin giao hàng đã được xóa thành công'
    });

  } catch (error) {
    logger.error('Delete payment info error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa thông tin giao hàng'
    });
  }
};

const setDefaultPaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find the payment info to set as default
    const paymentInfoIndex = user.paymentInfo.findIndex(info => info._id.toString() === id);
    
    if (paymentInfoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Payment info not found'
      });
    }

    // Unset all other defaults
    user.paymentInfo.forEach(info => {
      info.isDefault = false;
    });

    // Set this one as default
    user.paymentInfo[paymentInfoIndex].isDefault = true;
    user.paymentInfo[paymentInfoIndex].updatedAt = new Date();

    await user.save();

    logger.info(`Default payment info set for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Đã đặt làm thông tin giao hàng mặc định'
    });

  } catch (error) {
    logger.error('Set default payment info error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể đặt làm mặc định'
    });
  }
};

// Get public user info (for order service)
const getPublicUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    const user = await User.findById(id)
      .select('name email phone role');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Get public user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getPublicUserInfo,
  forgotPassword,
  resetPassword,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserStatistics,
  getDashboardStats,
  updateUserStatus,
  addRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  validateRefreshToken,
  getUserById,
  checkPhoneAvailability,
  checkEmailAvailability,
  getPaymentInfo,
  createPaymentInfo,
  updatePaymentInfo,
  deletePaymentInfo,
  setDefaultPaymentInfo
};
