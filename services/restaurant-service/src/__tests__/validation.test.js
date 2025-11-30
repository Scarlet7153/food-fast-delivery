const Joi = require('joi');
const { schemas } = require('../middlewares/validation');

describe('Restaurant Service Validation Schemas - Unit Tests', () => {
  describe('createRestaurant schema', () => {
    it('TC_VALID_031: Should validate valid restaurant data', () => {
      const validData = {
        name: 'Test Restaurant',
        address: '123 Test Street, Ho Chi Minh City',
        phone: '0123456789'
      };
      const { error } = schemas.createRestaurant.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_032: Should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A',
        address: '123 Test Street',
        phone: '0123456789'
      };
      const { error } = schemas.createRestaurant.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('TC_VALID_033: Should reject invalid phone format', () => {
      const invalidData = {
        name: 'Test Restaurant',
        address: '123 Test Street',
        phone: 'invalid-phone'
      };
      const { error } = schemas.createRestaurant.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('phone');
    });

    it('TC_VALID_034: Should reject address shorter than 10 characters', () => {
      const invalidData = {
        name: 'Test Restaurant',
        address: 'Short',
        phone: '0123456789'
      };
      const { error } = schemas.createRestaurant.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('address');
    });
  });

  describe('createMenuItem schema', () => {
    it('TC_VALID_035: Should validate valid menu item data', () => {
      const validData = {
        name: 'Bánh Mỳ',
        price: 25000,
        category: 'Main Dish'
      };
      const { error } = schemas.createMenuItem.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_036: Should reject negative price', () => {
      const invalidData = {
        name: 'Bánh Mỳ',
        price: -1000,
        category: 'Main Dish'
      };
      const { error } = schemas.createMenuItem.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('price');
    });

    it('TC_VALID_037: Should reject missing category', () => {
      const invalidData = {
        name: 'Bánh Mỳ',
        price: 25000
      };
      const { error } = schemas.createMenuItem.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('category');
    });
  });

  describe('updateRating schema', () => {
    it('TC_VALID_038: Should validate valid rating', () => {
      const validData = {
        rating: 5
      };
      const { error } = schemas.updateRating.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_039: Should reject rating less than 1', () => {
      const invalidData = {
        rating: 0
      };
      const { error } = schemas.updateRating.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('rating');
    });

    it('TC_VALID_040: Should reject rating greater than 5', () => {
      const invalidData = {
        rating: 6
      };
      const { error } = schemas.updateRating.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('rating');
    });
  });
});

