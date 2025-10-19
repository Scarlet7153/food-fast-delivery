const User = require('../models/User');
const { 
  generateTokenPair, 
  saveRefreshToken, 
  removeRefreshToken, 
  removeAllRefreshTokens,
  isRefreshTokenValid,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  verifyRefreshToken
} = require('../utils/jwt');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Register new user
const register = async (req, res) => {
  try {
    const { 
      email, password, name, phone, role,
      // Restaurant-specific fields
      restaurantName, restaurantAddress, restaurantPhone, 
      restaurantDescription, imageUrl 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phone,
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
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231] // Default to Ho Chi Minh City center
          },
          approved: false,  // Restaurant needs admin approval
          active: false     // Not active until approved
        };

        await axios.post(`${config.RESTAURANT_SERVICE_URL}/api/restaurants`, restaurantData);

        logger.info(`New restaurant registered (pending approval): ${user.email} - ${restaurantName}`);

        // For restaurant, return success without tokens (they can't login until approved)
        return res.status(201).json({
          success: true,
          message: 'Restaurant registered successfully. Please wait for admin approval.',
          data: {
            user: user.toSummary(),
            requiresApproval: true
          }
        });
      } catch (error) {
        // If restaurant creation fails, delete the user
        await User.findByIdAndDelete(user._id);
        throw error;
      }
    }

    // For customer, generate tokens and allow immediate login
    const { accessToken, refreshToken } = generateTokenPair(user._id);
    await saveRefreshToken(user._id, refreshToken);

    logger.info(`New customer registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toSummary(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
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
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if restaurant is approved (for restaurant owners)
    if (user.role === 'restaurant') {
      try {
        const response = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${user._id}`);
        const restaurant = response.data.data.restaurant;
        
        if (restaurant && !restaurant.approved) {
          return res.status(403).json({
            success: false,
            error: 'Your restaurant is pending approval. Please wait for admin approval.',
            pendingApproval: true
          });
        }
      } catch (error) {
        // If restaurant not found, allow login but user won't have restaurant access
        logger.warn(`Restaurant not found for user ${user._id}`);
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);
    await saveRefreshToken(user._id, refreshToken);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSummary(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const isValid = await isRefreshTokenValid(user._id, refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Remove old refresh token
    await removeRefreshToken(user._id, refreshToken);

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);
    await saveRefreshToken(user._id, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    // Only log non-token-expired errors to reduce log spam
    if (!error.message.includes('expired') && !error.message.includes('Invalid')) {
      logger.error('Token refresh error:', error);
    }
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await removeRefreshToken(req.user._id, refreshToken);
    }

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    await removeAllRefreshTokens(req.user._id);

    logger.info(`User logged out from all devices: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
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
        valid: false,
        error: 'No token provided'
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.active) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token'
      });
    }

    res.json({
      valid: true,
      user: user.toSummary()
    });

  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid token'
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user._id);
    
    // In a real application, you would send this token via email
    // For now, we'll just log it (in development)
    logger.info(`Password reset token for ${user.email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      // Only include token in development
      ...(process.env.NODE_ENV === 'development' && { resetToken })
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
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Verify reset token
    const decoded = verifyPasswordResetToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Remove all refresh tokens (force re-login)
    await removeAllRefreshTokens(user._id);

    logger.info(`Password reset for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  verifyToken,
  forgotPassword,
  resetPassword
};
