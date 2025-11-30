describe('Restaurant Model Methods - Unit Tests', () => {
  // Mock restaurant instance
  const createMockRestaurant = (data = {}) => {
    return {
      active: data.active ?? true,
      approved: data.approved ?? true,
      isOpen: data.isOpen ?? true,
      deliverySettings: {
        baseRate: data.baseRate ?? 10000,
        ratePerKm: data.ratePerKm ?? 5000,
        maxDeliveryDistance: data.maxDeliveryDistance ?? 10
      },
      rating: data.rating ?? { average: 0, count: 0 },
      canAcceptOrders() {
        return this.active && this.approved && this.isOpen;
      },
      calculateDeliveryFee(distanceKm) {
        if (distanceKm > this.deliverySettings.maxDeliveryDistance) {
          return null;
        }
        return this.deliverySettings.baseRate + (distanceKm * this.deliverySettings.ratePerKm);
      }
    };
  };

  describe('canAcceptOrders', () => {
    it('TC_MODEL_001: Should return true when restaurant is active, approved, and open', () => {
      const restaurant = createMockRestaurant({ active: true, approved: true, isOpen: true });
      expect(restaurant.canAcceptOrders()).toBe(true);
    });

    it('TC_MODEL_002: Should return false when restaurant is inactive', () => {
      const restaurant = createMockRestaurant({ active: false, approved: true, isOpen: true });
      expect(restaurant.canAcceptOrders()).toBe(false);
    });

    it('TC_MODEL_003: Should return false when restaurant is not approved', () => {
      const restaurant = createMockRestaurant({ active: true, approved: false, isOpen: true });
      expect(restaurant.canAcceptOrders()).toBe(false);
    });

    it('TC_MODEL_004: Should return false when restaurant is closed', () => {
      const restaurant = createMockRestaurant({ active: true, approved: true, isOpen: false });
      expect(restaurant.canAcceptOrders()).toBe(false);
    });

    it('TC_MODEL_005: Should return false when all conditions are false', () => {
      const restaurant = createMockRestaurant({ active: false, approved: false, isOpen: false });
      expect(restaurant.canAcceptOrders()).toBe(false);
    });
  });

  describe('calculateDeliveryFee', () => {
    it('TC_MODEL_006: Should calculate fee for valid distance', () => {
      const restaurant = createMockRestaurant();
      const fee = restaurant.calculateDeliveryFee(5);
      expect(fee).toBe(35000);
    });

    it('TC_MODEL_007: Should return null for distance exceeding max', () => {
      const restaurant = createMockRestaurant({ maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(15);
      expect(fee).toBeNull();
    });

    it('TC_MODEL_008: Should return base rate for 0 km', () => {
      const restaurant = createMockRestaurant();
      const fee = restaurant.calculateDeliveryFee(0);
      expect(fee).toBe(10000);
    });
  });
});

