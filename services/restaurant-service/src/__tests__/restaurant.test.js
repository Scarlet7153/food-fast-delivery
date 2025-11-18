const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const restaurantRoutes = require('../routes/restaurant.routes');
const axios = require('axios');

// Mock axios for user service verification
jest.mock('axios');

describe('Restaurant Service - Restaurant Management', () => {
  let app;
  let testRestaurant;
  let testMenuItem;
  let authToken;
  let mongoServer;
  let mockUser;
  let mockRestaurantOwner;

  beforeAll(async () => {
    jest.setTimeout(30000);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/restaurants', restaurantRoutes);

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    // Setup mock users for authentication
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'customer@example.com',
      role: 'customer',
      name: 'Test Customer'
    };

    mockRestaurantOwner = {
      _id: new mongoose.Types.ObjectId(),
      email: 'restaurant@example.com',
      role: 'restaurant',
      name: 'Restaurant Owner'
    };

    // Mock axios for user verification
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/user/verify')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              user: mockRestaurantOwner
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  }, 30000);

  afterAll(async () => {
    try {
      await Restaurant.deleteMany({});
      await MenuItem.deleteMany({});
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      if (mongoServer) {
        await mongoServer.stop();
      }
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  }, 30000);

  beforeEach(async () => {
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    authToken = 'mock-token';
    // Reset axios mocks
    axios.get.mockClear();
    // Re-setup default mock implementation
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/user/verify')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              user: mockRestaurantOwner
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  describe('POST /api/restaurants - Create Restaurant', () => {
    it('TC1: Should create restaurant successfully', async () => {
      const restaurantData = {
        name: 'Test Restaurant',
        description: 'A test restaurant',
        address: '123 Test Street, Ho Chi Minh City',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        email: 'restaurant@example.com'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(restaurantData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');
      expect(response.body.data.restaurant).toHaveProperty('name', 'Test Restaurant');
      expect(response.body.data.restaurant).toHaveProperty('ownerUserId', mockRestaurantOwner._id.toString());
      expect(response.body.data.restaurant).toHaveProperty('approved', false);
      expect(response.body.data.restaurant).toHaveProperty('active', false);

      // Verify restaurant was saved
      const savedRestaurant = await Restaurant.findOne({ name: 'Test Restaurant' });
      expect(savedRestaurant).toBeTruthy();
      expect(savedRestaurant.ownerUserId.toString()).toBe(mockRestaurantOwner._id.toString());
    });

    it('TC2: Should reject restaurant creation with missing required fields', async () => {
      const restaurantData = {
        description: 'A test restaurant'
        // Missing name, address
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(restaurantData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('TC3: Should reject restaurant creation without token', async () => {
      const restaurantData = {
        name: 'Test Restaurant',
        address: '123 Test Street'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .send(restaurantData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/restaurants - Get All Restaurants', () => {
    beforeEach(async () => {
      // Create test restaurants
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'Test Restaurant 1',
        description: 'Test restaurant 1',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();

      const restaurant2 = new Restaurant({
        ownerUserId: new mongoose.Types.ObjectId(),
        name: 'Test Restaurant 2',
        description: 'Test restaurant 2',
        address: '456 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6300, 10.8235]
        },
        phone: '0987654321',
        active: true,
        approved: true
      });
      await restaurant2.save();
    });

    it('TC4: Should get all active restaurants successfully', async () => {
      const response = await request(app)
        .get('/api/restaurants')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurants');
      expect(Array.isArray(response.body.data.restaurants)).toBe(true);
      expect(response.body.data.restaurants.length).toBeGreaterThan(0);
    });

    it('TC5: Should filter restaurants by search query', async () => {
      const response = await request(app)
        .get('/api/restaurants?search=Restaurant 1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.restaurants.length).toBeGreaterThan(0);
      expect(response.body.data.restaurants[0].name).toContain('Restaurant 1');
    });
  });

  describe('GET /api/restaurants/:id - Get Restaurant By ID', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'Test Restaurant',
        description: 'Test restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();
    });

    it('TC6: Should get restaurant by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/restaurants/${testRestaurant._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');
      expect(response.body.data.restaurant).toHaveProperty('_id', testRestaurant._id.toString());
      expect(response.body.data.restaurant).toHaveProperty('name', 'Test Restaurant');
    });

    it('TC7: Should return 404 for non-existent restaurant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/restaurants/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/restaurants/me - Get My Restaurant', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();
    });

    it('TC8: Should get my restaurant successfully', async () => {
      const response = await request(app)
        .get('/api/restaurants/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');
      expect(response.body.data.restaurant).toHaveProperty('ownerUserId', mockRestaurantOwner._id.toString());
      expect(response.body.data.restaurant).toHaveProperty('name', 'My Restaurant');
    });

    it('TC9: Should reject request from non-restaurant user', async () => {
      axios.get.mockImplementationOnce((url) => {
        if (url.includes('/api/user/verify')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                user: mockUser
              }
            }
          });
        }
      });

      const response = await request(app)
        .get('/api/restaurants/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/restaurants/me - Update My Restaurant', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();
    });

    it('TC10: Should update my restaurant successfully', async () => {
      const updateData = {
        name: 'Updated Restaurant Name',
        description: 'Updated description',
        phone: '0987654321'
      };

      const response = await request(app)
        .put('/api/restaurants/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');
      expect(response.body.data.restaurant).toHaveProperty('name', 'Updated Restaurant Name');
      expect(response.body.data.restaurant).toHaveProperty('phone', '0987654321');

      // Verify database was updated
      const updatedRestaurant = await Restaurant.findById(testRestaurant._id);
      expect(updatedRestaurant.name).toBe('Updated Restaurant Name');
      expect(updatedRestaurant.phone).toBe('0987654321');
    });
  });

  describe('POST /api/restaurants/me/toggle-status - Toggle Restaurant Status', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();
    });

    it('TC11: Should toggle restaurant status successfully', async () => {
      const response = await request(app)
        .post('/api/restaurants/me/toggle-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');

      // Verify status was toggled
      const updatedRestaurant = await Restaurant.findById(testRestaurant._id);
      expect(updatedRestaurant.active).toBe(false);
    });
  });

  describe('POST /api/restaurants/:restaurantId/menu - Create Menu Item', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();
    });

    it('TC12: Should create menu item successfully', async () => {
      const menuItemData = {
        name: 'Bánh Mỳ',
        description: 'Delicious Vietnamese sandwich',
        price: 25000,
        category: 'Main Dish',
        available: true
      };

      const response = await request(app)
        .post(`/api/restaurants/${testRestaurant._id}/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(menuItemData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('menuItem');
      expect(response.body.data.menuItem).toHaveProperty('name', 'Bánh Mỳ');
      expect(response.body.data.menuItem).toHaveProperty('price', 25000);
      expect(response.body.data.menuItem).toHaveProperty('restaurantId', testRestaurant._id.toString());

      // Verify menu item was saved
      const savedMenuItem = await MenuItem.findOne({ name: 'Bánh Mỳ' });
      expect(savedMenuItem).toBeTruthy();
      expect(savedMenuItem.price).toBe(25000);
    });

    it('TC13: Should reject menu item creation with missing required fields', async () => {
      const menuItemData = {
        description: 'Delicious Vietnamese sandwich'
        // Missing name, price
      };

      const response = await request(app)
        .post(`/api/restaurants/${testRestaurant._id}/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(menuItemData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/restaurants/:restaurantId/menu - Get Menu Items', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();

      testMenuItem = new MenuItem({
        restaurantId: testRestaurant._id,
        name: 'Bánh Mỳ',
        description: 'Delicious Vietnamese sandwich',
        price: 25000,
        category: 'Main Dish',
        available: true
      });
      await testMenuItem.save();

      const menuItem2 = new MenuItem({
        restaurantId: testRestaurant._id,
        name: 'Phở',
        description: 'Vietnamese noodle soup',
        price: 55000,
        category: 'Main Dish',
        available: true
      });
      await menuItem2.save();
    });

    it('TC14: Should get menu items successfully', async () => {
      const response = await request(app)
        .get(`/api/restaurants/${testRestaurant._id}/menu`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('menuItems');
      expect(Array.isArray(response.body.data.menuItems)).toBe(true);
      expect(response.body.data.menuItems.length).toBeGreaterThan(0);
    });

    it('TC15: Should filter menu items by category', async () => {
      const response = await request(app)
        .get(`/api/restaurants/${testRestaurant._id}/menu?category=Main Dish`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/restaurants/menu/:id - Update Menu Item', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();

      testMenuItem = new MenuItem({
        restaurantId: testRestaurant._id,
        name: 'Bánh Mỳ',
        description: 'Delicious Vietnamese sandwich',
        price: 25000,
        category: 'Main Dish',
        available: true
      });
      await testMenuItem.save();
    });

    it('TC16: Should update menu item successfully', async () => {
      const updateData = {
        name: 'Bánh Mỳ Đặc Biệt',
        price: 30000,
        description: 'Special Vietnamese sandwich'
      };

      const response = await request(app)
        .put(`/api/restaurants/menu/${testMenuItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('menuItem');
      expect(response.body.data.menuItem).toHaveProperty('name', 'Bánh Mỳ Đặc Biệt');
      expect(response.body.data.menuItem).toHaveProperty('price', 30000);

      // Verify database was updated
      const updatedMenuItem = await MenuItem.findById(testMenuItem._id);
      expect(updatedMenuItem.name).toBe('Bánh Mỳ Đặc Biệt');
      expect(updatedMenuItem.price).toBe(30000);
    });
  });

  describe('DELETE /api/restaurants/menu/:id - Delete Menu Item', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true
      });
      await testRestaurant.save();

      testMenuItem = new MenuItem({
        restaurantId: testRestaurant._id,
        name: 'Bánh Mỳ',
        description: 'Delicious Vietnamese sandwich',
        price: 25000,
        category: 'Main Dish',
        available: true
      });
      await testMenuItem.save();
    });

    it('TC17: Should delete menu item successfully', async () => {
      const response = await request(app)
        .delete(`/api/restaurants/menu/${testMenuItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify menu item was deleted
      const deletedMenuItem = await MenuItem.findById(testMenuItem._id);
      expect(deletedMenuItem).toBeNull();
    });
  });

  describe('POST /api/restaurants/:id/rating - Update Restaurant Rating', () => {
    beforeEach(async () => {
      testRestaurant = new Restaurant({
        ownerUserId: mockRestaurantOwner._id,
        name: 'My Restaurant',
        description: 'My restaurant description',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231]
        },
        phone: '0123456789',
        active: true,
        approved: true,
        rating: {
          average: 0,
          count: 0
        }
      });
      await testRestaurant.save();
    });

    it('TC18: Should update restaurant rating successfully', async () => {
      // Mock customer user for rating
      axios.get.mockImplementationOnce((url) => {
        if (url.includes('/api/user/verify')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                user: mockUser
              }
            }
          });
        }
      });

      const ratingData = {
        rating: 5,
        comment: 'Great food!'
      };

      const response = await request(app)
        .post(`/api/restaurants/${testRestaurant._id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('restaurant');
    });
  });
});
