describe('Order Calculation Functions - Unit Tests', () => {
  // Helper function to calculate order total
  const calculateOrderTotal = (items, deliveryFee = 0, tax = 0, discount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      subtotal,
      deliveryFee,
      tax,
      discount,
      total: subtotal + deliveryFee + tax - discount
    };
  };

  // Helper function to calculate item total
  const calculateItemTotal = (price, quantity) => {
    return price * quantity;
  };

  // Helper function to calculate tax
  const calculateTax = (subtotal, taxRate = 0.1) => {
    return Math.round(subtotal * taxRate);
  };

  // Helper function to apply discount
  const applyDiscount = (total, discountPercent) => {
    return Math.round(total * (discountPercent / 100));
  };

  describe('calculateOrderTotal', () => {
    it('TC_ORDER_CALC_001: Should calculate total for single item', () => {
      const items = [{ price: 25000, quantity: 1 }];
      const result = calculateOrderTotal(items, 10000);
      expect(result.subtotal).toBe(25000);
      expect(result.total).toBe(35000);
    });

    it('TC_ORDER_CALC_002: Should calculate total for multiple items', () => {
      const items = [
        { price: 25000, quantity: 2 },
        { price: 50000, quantity: 1 }
      ];
      const result = calculateOrderTotal(items, 10000);
      expect(result.subtotal).toBe(100000);
      expect(result.total).toBe(110000);
    });

    it('TC_ORDER_CALC_003: Should include tax in total', () => {
      const items = [{ price: 100000, quantity: 1 }];
      const result = calculateOrderTotal(items, 10000, 10000);
      expect(result.subtotal).toBe(100000);
      expect(result.tax).toBe(10000);
      expect(result.total).toBe(120000);
    });

    it('TC_ORDER_CALC_004: Should apply discount correctly', () => {
      const items = [{ price: 100000, quantity: 1 }];
      const result = calculateOrderTotal(items, 10000, 0, 10000);
      expect(result.subtotal).toBe(100000);
      expect(result.discount).toBe(10000);
      expect(result.total).toBe(100000);
    });

    it('TC_ORDER_CALC_005: Should calculate with all components', () => {
      const items = [{ price: 100000, quantity: 1 }];
      const result = calculateOrderTotal(items, 10000, 10000, 5000);
      expect(result.subtotal).toBe(100000);
      expect(result.deliveryFee).toBe(10000);
      expect(result.tax).toBe(10000);
      expect(result.discount).toBe(5000);
      expect(result.total).toBe(115000);
    });

    it('TC_ORDER_CALC_006: Should handle zero quantity', () => {
      const items = [{ price: 25000, quantity: 0 }];
      const result = calculateOrderTotal(items, 10000);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(10000);
    });

    it('TC_ORDER_CALC_007: Should handle decimal prices', () => {
      const items = [{ price: 25.5, quantity: 2 }];
      const result = calculateOrderTotal(items, 10);
      expect(result.subtotal).toBe(51);
      expect(result.total).toBe(61);
    });
  });

  describe('calculateItemTotal', () => {
    it('TC_ORDER_CALC_008: Should calculate item total correctly', () => {
      expect(calculateItemTotal(25000, 2)).toBe(50000);
    });

    it('TC_ORDER_CALC_009: Should handle quantity of 1', () => {
      expect(calculateItemTotal(25000, 1)).toBe(25000);
    });

    it('TC_ORDER_CALC_010: Should handle large quantities', () => {
      expect(calculateItemTotal(1000, 100)).toBe(100000);
    });
  });

  describe('calculateTax', () => {
    it('TC_ORDER_CALC_011: Should calculate tax with default rate (10%)', () => {
      expect(calculateTax(100000)).toBe(10000);
    });

    it('TC_ORDER_CALC_012: Should calculate tax with custom rate', () => {
      expect(calculateTax(100000, 0.08)).toBe(8000);
    });

    it('TC_ORDER_CALC_013: Should round tax to nearest integer', () => {
      expect(calculateTax(33333, 0.1)).toBe(3333);
    });

    it('TC_ORDER_CALC_014: Should handle zero tax rate', () => {
      expect(calculateTax(100000, 0)).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('TC_ORDER_CALC_015: Should apply 10% discount', () => {
      expect(applyDiscount(100000, 10)).toBe(10000);
    });

    it('TC_ORDER_CALC_016: Should apply 50% discount', () => {
      expect(applyDiscount(100000, 50)).toBe(50000);
    });

    it('TC_ORDER_CALC_017: Should round discount to nearest integer', () => {
      expect(applyDiscount(33333, 10)).toBe(3333);
    });

    it('TC_ORDER_CALC_018: Should handle zero discount', () => {
      expect(applyDiscount(100000, 0)).toBe(0);
    });

    it('TC_ORDER_CALC_019: Should handle 100% discount', () => {
      expect(applyDiscount(100000, 100)).toBe(100000);
    });
  });
});

