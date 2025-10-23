const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// Generate access token
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate token pair
const generateTokenPair = (userId, role) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN
  };
};

// Save refresh token to database
const saveRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          createdAt: new Date()
        }
      }
    });
  } catch (error) {
    throw new Error('Failed to save refresh token');
  }
};

// Remove refresh token
const removeRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        refreshTokens: { token: refreshToken }
      }
    });
  } catch (error) {
    throw new Error('Failed to remove refresh token');
  }
};

// Remove all refresh tokens for user
const removeAllRefreshTokens = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });
  } catch (error) {
    throw new Error('Failed to remove all refresh tokens');
  }
};

// Check if refresh token is valid
const isRefreshTokenValid = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    return user.refreshTokens.some(rt => rt.token === refreshToken);
  } catch (error) {
    return false;
  }
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password-reset' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_RESET_EXPIRES_IN }
  );
};

// Verify password reset token
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid password reset token');
    }
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid or expired password reset token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  saveRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  isRefreshTokenValid,
  generatePasswordResetToken,
  verifyPasswordResetToken
};





