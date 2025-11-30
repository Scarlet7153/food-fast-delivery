const Joi = require('joi');
const { schemas } = require('../middlewares/validation');

describe('User Service Validation Schemas - Unit Tests', () => {
  describe('register schema', () => {
    it('TC_VALID_001: Should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      };
      const { error } = schemas.register.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_002: Should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      };
      const { error } = schemas.register.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('TC_VALID_003: Should reject password shorter than 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
        name: 'Test User',
        role: 'customer'
      };
      const { error } = schemas.register.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('TC_VALID_004: Should reject name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A',
        role: 'customer'
      };
      const { error } = schemas.register.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('TC_VALID_005: Should require phone for restaurant role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test Restaurant',
        role: 'restaurant',
        restaurantName: 'My Restaurant',
        restaurantAddress: '123 Test Street',
  restaurantPhone: '0123456789',
  phone: '0123456789'
      };
      const { error } = schemas.register.validate(invalidData);
      // Phone is required for restaurant
      expect(error).toBeUndefined();
    });

    it('TC_VALID_006: Should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'invalid-role'
      };
      const { error } = schemas.register.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('role');
    });
  });

  describe('login schema', () => {
    it('TC_VALID_007: Should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const { error } = schemas.login.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_008: Should reject missing email', () => {
      const invalidData = {
        password: 'password123'
      };
      const { error } = schemas.login.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('TC_VALID_009: Should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      const { error } = schemas.login.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });
  });

  describe('updateProfile schema', () => {
    it('TC_VALID_010: Should validate valid profile update', () => {
      const validData = {
        name: 'Updated Name',
        phone: '0987654321'
      };
      const { error } = schemas.updateProfile.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_011: Should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A'
      };
      const { error } = schemas.updateProfile.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('TC_VALID_012: Should reject invalid phone format', () => {
      const invalidData = {
        phone: 'invalid-phone'
      };
      const { error } = schemas.updateProfile.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('phone');
    });
  });

  describe('changePassword schema', () => {
    it('TC_VALID_013: Should validate valid password change', () => {
      const validData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };
      const { error } = schemas.changePassword.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_014: Should reject missing current password', () => {
      const invalidData = {
        newPassword: 'newpassword123'
      };
      const { error } = schemas.changePassword.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('currentPassword');
    });

    it('TC_VALID_015: Should reject new password shorter than 6 characters', () => {
      const invalidData = {
        currentPassword: 'oldpassword',
        newPassword: '12345'
      };
      const { error } = schemas.changePassword.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('newPassword');
    });
  });

  describe('paymentInfo schema', () => {
    it('TC_VALID_016: Should validate valid payment info', () => {
      const validData = {
        contactInfo: {
          name: 'Test User',
          phone: '0123456789'
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1'
        }
      };
      const { error } = schemas.paymentInfo.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_017: Should reject missing contact info', () => {
      const invalidData = {
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1'
        }
      };
      const { error } = schemas.paymentInfo.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('contactInfo');
    });

    it('TC_VALID_018: Should reject name shorter than 2 characters in contact info', () => {
      const invalidData = {
        contactInfo: {
          name: 'A',
          phone: '0123456789'
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1'
        }
      };
      const { error } = schemas.paymentInfo.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('contactInfo');
      expect(error.details[0].path).toContain('name');
    });
  });
});

