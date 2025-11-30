const Joi = require('joi');
const { schemas } = require('../middlewares/validation');

describe('Drone Service Validation Schemas - Unit Tests', () => {
  describe('createDrone schema', () => {
    it('TC_VALID_047: Should validate valid drone data', () => {
      const validData = {
        name: 'Drone_001',
        model: 'DJI',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      };
      const { error } = schemas.createDrone.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_048: Should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A',
        model: 'DJI',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      };
      const { error } = schemas.createDrone.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('TC_VALID_049: Should reject payload less than 100 grams', () => {
      const invalidData = {
        name: 'Drone_001',
        model: 'DJI',
        maxPayloadGrams: 50,
        maxRangeMeters: 5000
      };
      const { error } = schemas.createDrone.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('maxPayloadGrams');
    });

    it('TC_VALID_050: Should reject range less than 100 meters', () => {
      const invalidData = {
        name: 'Drone_001',
        model: 'DJI',
        maxPayloadGrams: 1000,
        maxRangeMeters: 50
      };
      const { error } = schemas.createDrone.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('maxRangeMeters');
    });
  });

  describe('updateDroneStatus schema', () => {
    it('TC_VALID_051: Should validate valid status update', () => {
      const validData = {
        status: 'IDLE'
      };
      const { error } = schemas.updateDroneStatus.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_052: Should reject invalid status', () => {
      const invalidData = {
        status: 'INVALID'
      };
      const { error } = schemas.updateDroneStatus.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('status');
    });
  });

  describe('createMission schema', () => {
    it('TC_VALID_053: Should validate valid mission data', () => {
      const validData = {
        orderId: '507f1f77bcf86cd799439011',
        droneId: '507f1f77bcf86cd799439012'
      };
      const { error } = schemas.createMission.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_054: Should reject missing orderId', () => {
      const invalidData = {
        droneId: '507f1f77bcf86cd799439012'
      };
      const { error } = schemas.createMission.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('orderId');
    });
  });
});

