const Joi = require('joi');
const { schemas } = require('../middlewares/validation');

describe('Order Service Validation Schemas - Unit Tests', () => {
  describe('createOrder schema', () => {
    it('TC_VALID_019: Should validate valid order data', () => {
      const validData = {
        restaurantId: '507f1f77bcf86cd799439011',
        items: [
          {
            menuItemId: '507f1f77bcf86cd799439012',
            name: 'Bánh Mỳ',
            price: 25000,
            quantity: 1,
            totalPrice: 25000
          }
        ],
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND'
        },
        deliveryAddress: {
          text: '123 Test Street, Ho Chi Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          }
        }
      };
      const { error } = schemas.createOrder.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_020: Should reject missing restaurantId', () => {
      const invalidData = {
        items: [{ menuItemId: '123', name: 'Item', price: 10000, quantity: 1, totalPrice: 10000 }],
        amount: { subtotal: 10000, deliveryFee: 5000, total: 15000 },
        deliveryAddress: { text: '123 Test', location: { type: 'Point', coordinates: [106, 10] } }
      };
      const { error } = schemas.createOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('restaurantId');
    });

    it('TC_VALID_021: Should reject empty items array', () => {
      const invalidData = {
        restaurantId: '507f1f77bcf86cd799439011',
        items: [],
        amount: { subtotal: 0, deliveryFee: 5000, total: 5000 },
        deliveryAddress: { text: '123 Test', location: { type: 'Point', coordinates: [106, 10] } }
      };
      const { error } = schemas.createOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('items');
    });

    it('TC_VALID_022: Should reject item with quantity less than 1', () => {
      const invalidData = {
        restaurantId: '507f1f77bcf86cd799439011',
        items: [{ menuItemId: '123', name: 'Item', price: 10000, quantity: 0, totalPrice: 0 }],
        amount: { subtotal: 0, deliveryFee: 5000, total: 5000 },
        deliveryAddress: { text: '123 Test', location: { type: 'Point', coordinates: [106, 10] } }
      };
      const { error } = schemas.createOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('quantity');
    });

    it('TC_VALID_023: Should reject negative price', () => {
      const invalidData = {
        restaurantId: '507f1f77bcf86cd799439011',
        items: [{ menuItemId: '123', name: 'Item', price: -1000, quantity: 1, totalPrice: -1000 }],
        amount: { subtotal: -1000, deliveryFee: 5000, total: 4000 },
        deliveryAddress: { text: '123 Test', location: { type: 'Point', coordinates: [106, 10] } }
      };
      const { error } = schemas.createOrder.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('TC_VALID_024: Should reject invalid payment method', () => {
      const invalidData = {
        restaurantId: '507f1f77bcf86cd799439011',
        items: [{ menuItemId: '123', name: 'Item', price: 10000, quantity: 1, totalPrice: 10000 }],
        amount: { subtotal: 10000, deliveryFee: 5000, total: 15000 },
        payment: { method: 'COD' },
        deliveryAddress: { text: '123 Test', location: { type: 'Point', coordinates: [106, 10] } }
      };
      const { error } = schemas.createOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('method');
    });
  });

  describe('updateOrderStatus schema', () => {
    it('TC_VALID_025: Should validate valid status update', () => {
      const validData = {
        status: 'CONFIRMED'
      };
      const { error } = schemas.updateOrderStatus.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_026: Should reject invalid status', () => {
      const invalidData = {
        status: 'INVALID_STATUS'
      };
      const { error } = schemas.updateOrderStatus.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('status');
    });

    it('TC_VALID_027: Should accept all valid statuses', () => {
      const validStatuses = ['PLACED', 'CONFIRMED', 'COOKING', 'READY_FOR_PICKUP', 'IN_FLIGHT', 'DELIVERED', 'CANCELLED', 'FAILED'];
      validStatuses.forEach(status => {
        const { error } = schemas.updateOrderStatus.validate({ status });
        expect(error).toBeUndefined();
      });
    });
  });

  describe('cancelOrder schema', () => {
    it('TC_VALID_028: Should validate valid cancellation', () => {
      const validData = {
        reason: 'Changed my mind'
      };
      const { error } = schemas.cancelOrder.validate(validData);
      expect(error).toBeUndefined();
    });

    it('TC_VALID_029: Should reject reason shorter than 5 characters', () => {
      const invalidData = {
        reason: 'No'
      };
      const { error } = schemas.cancelOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reason');
    });

    it('TC_VALID_030: Should reject reason longer than 200 characters', () => {
      const invalidData = {
        reason: 'A'.repeat(201)
      };
      const { error } = schemas.cancelOrder.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reason');
    });
  });
});

