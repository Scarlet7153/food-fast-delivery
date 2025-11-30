const Joi = require('joi');
const { schemas } = require('../middlewares/validation');

describe('Payment Service Validation Schemas - Unit Tests', () => {
  describe('createPayment schema', () => {
    it('TC_VALID_041: Should validate valid payment data', () => {
      const validData = {
        orderId: '507f1f77bcf86cd799439011',
        method: 'MOMO'
      };
      const { error } = schemas.createPayment.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_042: Should reject missing orderId', () => {
      const invalidData = {
        method: 'MOMO'
      };
      const { error } = schemas.createPayment.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('orderId');
    });

    it('TC_VALID_043: Should reject invalid payment method', () => {
      const invalidData = {
        orderId: '507f1f77bcf86cd799439011',
        method: 'COD'
      };
      const { error } = schemas.createPayment.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('method');
    });
  });

  describe('processRefund schema', () => {
    it('TC_VALID_044: Should validate valid refund data', () => {
      const validData = {
        paymentId: '507f1f77bcf86cd799439011',
        amount: 50000,
        reason: 'Order cancelled by customer'
      };
      const { error } = schemas.processRefund.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_045: Should reject reason shorter than 5 characters', () => {
      const invalidData = {
        paymentId: '507f1f77bcf86cd799439011',
        reason: 'No'
      };
      const { error } = schemas.processRefund.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reason');
    });

    it('TC_VALID_046: Should reject negative amount', () => {
      const invalidData = {
        paymentId: '507f1f77bcf86cd799439011',
        amount: -1000,
        reason: 'Valid reason for refund'
      };
      const { error } = schemas.processRefund.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('amount');
    });
  });
});

