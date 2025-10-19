const jwt = require('jsonwebtoken');
const config = require('../config/env');
const axios = require('axios');

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
    config.JWT_SECRET,
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
    const decoded = jwt.verify(token, config.JWT_SECRET);
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

// Save refresh token to user service
const saveRefreshToken = async (userId, refreshToken) => {
  try {
    await axios.post(`${config.USER_SERVICE_URL}/api/users/${userId}/refresh-tokens`, {
      token: refreshToken
    });
  } catch (error) {
    throw new Error('Failed to save refresh token');
  }
};

// Remove refresh token
const removeRefreshToken = async (userId, refreshToken) => {
  try {
    await axios.delete(`${config.USER_SERVICE_URL}/api/users/${userId}/refresh-tokens`, {
      data: { token: refreshToken }
    });
  } catch (error) {
    throw new Error('Failed to remove refresh token');
  }
};

// Remove all refresh tokens for user
const removeAllRefreshTokens = async (userId) => {
  try {
    await axios.delete(`${config.USER_SERVICE_URL}/api/users/${userId}/refresh-tokens/all`);
  } catch (error) {
    throw new Error('Failed to remove all refresh tokens');
  }
};

// Check if refresh token is valid
const isRefreshTokenValid = async (userId, refreshToken) => {
  try {
    const response = await axios.post(`${config.USER_SERVICE_URL}/api/users/${userId}/refresh-tokens/validate`, {
      token: refreshToken
    });
    return response.data.valid;
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
