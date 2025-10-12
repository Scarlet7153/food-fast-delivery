const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
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
const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN
  };
};

// Save refresh token to user
const saveRefreshToken = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Remove old refresh tokens (keep only last 5)
  user.refreshTokens = user.refreshTokens.slice(-4);
  
  // Add new refresh token
  user.refreshTokens.push({ token: refreshToken });
  
  await user.save();
  return user;
};

// Remove refresh token
const removeRefreshToken = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  user.refreshTokens = user.refreshTokens.filter(
    tokenObj => tokenObj.token !== refreshToken
  );
  
  await user.save();
  return user;
};

// Remove all refresh tokens for user
const removeAllRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  user.refreshTokens = [];
  await user.save();
  return user;
};

// Check if refresh token is valid
const isRefreshTokenValid = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }
  
  return user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password-reset' },
    config.JWT_SECRET,
    { expiresIn: '1h' } // Password reset tokens expire in 1 hour
  );
};

// Verify password reset token
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid password reset token');
    }
    return decoded;
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

