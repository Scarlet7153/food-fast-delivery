const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  generatePasswordResetToken,
  verifyPasswordResetToken
} = require('../utils/jwt');

// Mock config
jest.mock('../config/env', () => ({
  JWT_SECRET: 'test-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_RESET_EXPIRES_IN: '1h'
}));

describe('JWT Utility Functions - Unit Tests', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testRole = 'customer';

  describe('generateAccessToken', () => {
    it('TC_JWT_001: Should generate valid access token', () => {
      const token = generateAccessToken(testUserId, testRole);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('TC_JWT_002: Should generate different tokens for different users', () => {
      const token1 = generateAccessToken('user1', 'customer');
      const token2 = generateAccessToken('user2', 'customer');
      expect(token1).not.toBe(token2);
    });

    it('TC_JWT_003: Should generate different tokens for different roles', () => {
      const token1 = generateAccessToken(testUserId, 'customer');
      const token2 = generateAccessToken(testUserId, 'restaurant');
      expect(token1).not.toBe(token2);
    });

    it('TC_JWT_004: Should include userId in token payload', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(testUserId);
    });

    it('TC_JWT_005: Should include role in token payload', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = jwt.decode(token);
      expect(decoded.role).toBe(testRole);
    });
  });

  describe('generateRefreshToken', () => {
    it('TC_JWT_006: Should generate valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('TC_JWT_007: Should include userId in refresh token payload', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(testUserId);
    });

    it('TC_JWT_008: Should include type "refresh" in token payload', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = jwt.decode(token);
      expect(decoded.type).toBe('refresh');
    });

    it('TC_JWT_009: Should generate different tokens for different users', () => {
      const token1 = generateRefreshToken('user1');
      const token2 = generateRefreshToken('user2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('TC_JWT_010: Should verify valid access token', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe(testRole);
    });

    it('TC_JWT_011: Should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow('Invalid access token');
    });

    it('TC_JWT_012: Should throw error for expired token', () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUserId, role: testRole },
        'test-secret',
        { expiresIn: '-1h' }
      );
      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow('Invalid access token');
    });

    it('TC_JWT_013: Should throw error for token with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: testUserId, role: testRole },
        'wrong-secret'
      );
      expect(() => {
        verifyAccessToken(wrongToken);
      }).toThrow('Invalid access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('TC_JWT_014: Should verify valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.type).toBe('refresh');
    });

    it('TC_JWT_015: Should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow('Invalid refresh token');
    });

    it('TC_JWT_016: Should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(testUserId, testRole);
      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow('Invalid refresh token');
    });

    it('TC_JWT_017: Should throw error for refresh token with wrong type', () => {
      const wrongTypeToken = jwt.sign(
        { userId: testUserId, type: 'wrong-type' },
        'test-refresh-secret'
      );
      expect(() => {
        verifyRefreshToken(wrongTypeToken);
      }).toThrow('Invalid refresh token');
    });
  });

  describe('generateTokenPair', () => {
    it('TC_JWT_018: Should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(testUserId, testRole);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
    });

    it('TC_JWT_019: Should generate valid token pair', () => {
      const tokens = generateTokenPair(testUserId, testRole);
      const accessDecoded = verifyAccessToken(tokens.accessToken);
      const refreshDecoded = verifyRefreshToken(tokens.refreshToken);
      expect(accessDecoded.userId).toBe(testUserId);
      expect(refreshDecoded.userId).toBe(testUserId);
    });

    it('TC_JWT_020: Should include expiresIn in token pair', () => {
      const tokens = generateTokenPair(testUserId, testRole);
      expect(tokens.expiresIn).toBeDefined();
      expect(typeof tokens.expiresIn).toBe('string');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('TC_JWT_021: Should generate valid password reset token', () => {
      const token = generatePasswordResetToken(testUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('TC_JWT_022: Should include userId in reset token payload', () => {
      const token = generatePasswordResetToken(testUserId);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(testUserId);
    });

    it('TC_JWT_023: Should include type "password-reset" in token payload', () => {
      const token = generatePasswordResetToken(testUserId);
      const decoded = jwt.decode(token);
      expect(decoded.type).toBe('password-reset');
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('TC_JWT_024: Should verify valid password reset token', () => {
      const token = generatePasswordResetToken(testUserId);
      const userId = verifyPasswordResetToken(token);
      expect(userId).toBe(testUserId);
    });

    it('TC_JWT_025: Should throw error for invalid reset token', () => {
      expect(() => {
        verifyPasswordResetToken('invalid-token');
      }).toThrow('Invalid or expired password reset token');
    });

    it('TC_JWT_026: Should throw error for access token used as reset token', () => {
      const accessToken = generateAccessToken(testUserId, testRole);
      expect(() => {
        verifyPasswordResetToken(accessToken);
      }).toThrow('Invalid or expired password reset token');
    });

    it('TC_JWT_027: Should throw error for reset token with wrong type', () => {
      const wrongTypeToken = jwt.sign(
        { userId: testUserId, type: 'wrong-type' },
        'test-secret'
      );
      expect(() => {
        verifyPasswordResetToken(wrongTypeToken);
      }).toThrow('Invalid or expired password reset token');
    });
  });
});

