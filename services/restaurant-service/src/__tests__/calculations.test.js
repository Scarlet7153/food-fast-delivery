describe('Restaurant Calculation Functions - Unit Tests', () => {
  // Mock restaurant instance with delivery settings
  const createMockRestaurant = (settings) => {
    return {
      deliverySettings: {
        baseRate: settings.baseRate || 10000,
        ratePerKm: settings.ratePerKm || 5000,
        maxDeliveryDistance: settings.maxDeliveryDistance || 10
      },
      calculateDeliveryFee(distanceKm) {
        if (distanceKm > this.deliverySettings.maxDeliveryDistance) {
          return null;
        }
        return this.deliverySettings.baseRate + (distanceKm * this.deliverySettings.ratePerKm);
      },
      updateRating(newRating) {
        const currentRating = this.rating || { average: 0, count: 0 };
        const newCount = currentRating.count + 1;
        const newAverage = ((currentRating.average * currentRating.count) + newRating) / newCount;
        this.rating = {
          average: Math.round(newAverage * 10) / 10,
          count: newCount
        };
        return this.rating;
      }
    };
  };

  describe('calculateDeliveryFee', () => {
    it('TC_CALC_001: Should calculate delivery fee for valid distance', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(5);
      expect(fee).toBe(35000); // 10000 + (5 * 5000)
    });

    it('TC_CALC_002: Should return base rate for 0 km distance', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(0);
      expect(fee).toBe(10000);
    });

    it('TC_CALC_003: Should return null for distance exceeding max', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(15);
      expect(fee).toBeNull();
    });

    it('TC_CALC_004: Should calculate correctly for max distance', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(10);
      expect(fee).toBe(60000); // 10000 + (10 * 5000)
    });

    it('TC_CALC_005: Should handle different base rates', () => {
      const restaurant = createMockRestaurant({ baseRate: 15000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(5);
      expect(fee).toBe(40000); // 15000 + (5 * 5000)
    });

    it('TC_CALC_006: Should handle different rate per km', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 3000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(5);
      expect(fee).toBe(25000); // 10000 + (5 * 3000)
    });

    it('TC_CALC_007: Should handle decimal distances', () => {
      const restaurant = createMockRestaurant({ baseRate: 10000, ratePerKm: 5000, maxDeliveryDistance: 10 });
      const fee = restaurant.calculateDeliveryFee(2.5);
      expect(fee).toBe(22500); // 10000 + (2.5 * 5000)
    });
  });

  describe('updateRating', () => {
    it('TC_CALC_008: Should calculate average rating correctly for first rating', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 0, count: 0 };
      const result = restaurant.updateRating(5);
      expect(result.average).toBe(5);
      expect(result.count).toBe(1);
    });

    it('TC_CALC_009: Should calculate average rating correctly for multiple ratings', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 4, count: 2 };
      const result = restaurant.updateRating(5);
      expect(result.average).toBe(4.3); // (4*2 + 5) / 3 = 4.33... rounded to 4.3
      expect(result.count).toBe(3);
    });

    it('TC_CALC_010: Should round average to 1 decimal place', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 3.5, count: 2 };
      const result = restaurant.updateRating(4);
      expect(result.average).toBe(3.7); // (3.5*2 + 4) / 3 = 3.666... rounded to 3.7
    });

    it('TC_CALC_011: Should handle minimum rating (1)', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 0, count: 0 };
      const result = restaurant.updateRating(1);
      expect(result.average).toBe(1);
      expect(result.count).toBe(1);
    });

    it('TC_CALC_012: Should handle maximum rating (5)', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 0, count: 0 };
      const result = restaurant.updateRating(5);
      expect(result.average).toBe(5);
      expect(result.count).toBe(1);
    });

    it('TC_CALC_013: Should calculate correctly with many ratings', () => {
      const restaurant = createMockRestaurant({});
      restaurant.rating = { average: 4.2, count: 10 };
      const result = restaurant.updateRating(5);
      expect(result.average).toBe(4.3); // (4.2*10 + 5) / 11 = 4.27... rounded to 4.3
      expect(result.count).toBe(11);
    });
  });
});

