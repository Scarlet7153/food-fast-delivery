const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const droneRoutes = require('../routes/drone.routes');
const axios = require('axios');

// Mock axios for user service verification
jest.mock('axios');

describe('Drone Service - Drone Management', () => {
  let app;
  let testDrone;
  let testMission;
  let authToken;
  let mongoServer;
  let mockUser;

  beforeAll(async () => {
    jest.setTimeout(30000);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/drones', droneRoutes);

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    // Setup mock user for authentication
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'restaurant@example.com',
      role: 'restaurant',
      name: 'Restaurant Owner'
    };

    // Mock axios for user verification, restaurant service, and order service
    axios.get.mockImplementation((url) => {
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
      if (url.includes('/api/restaurants/owner/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              restaurant: {
                _id: mockUser._id
              }
            }
          }
        });
      }
      if (url.includes('/api/orders/') && !url.includes('/api/internal/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              order: {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(),
                status: 'CONFIRMED',
                deliveryAddress: {
                  text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
                  location: {
                    type: 'Point',
                    coordinates: [106.6297, 10.8231]
                  },
                  contactPhone: '0352773474',
                  contactName: 'Võ Duy Toàn'
                },
                items: [
                  {
                    quantity: 1,
                    weightGrams: 200
                  }
                ]
              }
            }
          }
        });
      }
      if (url.includes('/api/internal/orders/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              order: {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(),
                status: 'CONFIRMED'
              }
            }
          }
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
  }, 30000);

  afterAll(async () => {
    try {
      await Drone.deleteMany({});
      await DeliveryMission.deleteMany({});
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
    await Drone.deleteMany({});
    await DeliveryMission.deleteMany({});
    authToken = 'mock-token';
  });

  describe('POST /api/drones - Create Drone', () => {
    it('TC1: Should create drone successfully', async () => {
      const droneData = {
        name: 'Drone_001',
        model: 'DJI',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      };

      const response = await request(app)
        .post('/api/drones')
        .set('Authorization', `Bearer ${authToken}`)
        .send(droneData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drone');
      expect(response.body.data.drone).toHaveProperty('name', 'Drone_001');
      expect(response.body.data.drone).toHaveProperty('status', 'IDLE');

      // Verify drone was saved
      const savedDrone = await Drone.findOne({ name: 'Drone_001' });
      expect(savedDrone).toBeTruthy();
      expect(savedDrone.status).toBe('IDLE');
      expect(savedDrone.model).toBe('DJI');
    });

    it('TC2: Should reject drone creation with missing required fields', async () => {
      const droneData = {
        model: 'Standard Delivery Drone'
        // Missing name
      };

      const response = await request(app)
        .post('/api/drones')
        .set('Authorization', `Bearer ${authToken}`)
        .send(droneData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('TC3: Should reject request from non-restaurant user', async () => {
      const customerUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'customer@example.com',
        role: 'customer',
        name: 'Customer'
      };

      axios.get.mockImplementationOnce((url) => {
        if (url.includes('/api/user/verify')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                user: customerUser
              }
            }
          });
        }
      });

      const droneData = {
        name: 'Drone 1',
        model: 'Standard Delivery Drone'
      };

      const response = await request(app)
        .post('/api/drones')
        .set('Authorization', `Bearer ${authToken}`)
        .send(droneData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/drones - Get Restaurant Drones', () => {
    beforeEach(async () => {
      // Create test drones
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();

      const drone2 = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_002',
        model: 'DJI',
        status: 'BUSY',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await drone2.save();
    });

    it('TC4: Should get restaurant drones successfully', async () => {
      const response = await request(app)
        .get('/api/drones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drones');
      expect(Array.isArray(response.body.data.drones)).toBe(true);
      expect(response.body.data.drones.length).toBeGreaterThan(0);
    });

    it('TC5: Should reject request without token', async () => {
      const response = await request(app)
        .get('/api/drones')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/drones/:id - Get Drone By ID', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();
    });

    it('TC6: Should get drone by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/drones/${testDrone._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drone');
      expect(response.body.data.drone).toHaveProperty('_id', testDrone._id.toString());
      expect(response.body.data.drone).toHaveProperty('name', 'Drone_001');
    });

    it('TC7: Should return 404 for non-existent drone', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/drones/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/drones/available - Get Available Drones', () => {
    beforeEach(async () => {
      // Create available drone
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();

      // Create busy drone
      const busyDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_002',
        model: 'DJI',
        status: 'BUSY',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await busyDrone.save();
    });

    it('TC8: Should get only available drones', async () => {
      const response = await request(app)
        .get('/api/drones/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drones');
      expect(Array.isArray(response.body.data.drones)).toBe(true);
      // All returned drones should be IDLE
      response.body.data.drones.forEach(drone => {
        expect(drone.status).toBe('IDLE');
      });
    });
  });

  describe('PUT /api/drones/:id - Update Drone', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();
    });

    it('TC9: Should update drone successfully', async () => {
      const updateData = {
        name: 'Drone_001_Updated',
        model: 'DJI Pro',
        maxPayloadGrams: 2000
      };

      const response = await request(app)
        .put(`/api/drones/${testDrone._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drone');
      expect(response.body.data.drone).toHaveProperty('name', 'Drone_001_Updated');

      // Verify database was updated
      const updatedDrone = await Drone.findById(testDrone._id);
      expect(updatedDrone.name).toBe('Drone_001_Updated');
      expect(updatedDrone.maxPayloadGrams).toBe(2000);
    });
  });

  describe('PATCH /api/drones/:id/status - Update Drone Status', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();
    });

    it('TC10: Should update drone status successfully', async () => {
      const updateData = {
        status: 'BUSY'
      };

      const response = await request(app)
        .patch(`/api/drones/${testDrone._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('drone');
      expect(response.body.data.drone).toHaveProperty('status', 'BUSY');

      // Verify database was updated
      const updatedDrone = await Drone.findById(testDrone._id);
      expect(updatedDrone.status).toBe('BUSY');
    });
  });

  describe('DELETE /api/drones/:id - Delete Drone', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();
    });

    it('TC11: Should delete drone successfully', async () => {
      const response = await request(app)
        .delete(`/api/drones/${testDrone._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify drone was deleted
      const deletedDrone = await Drone.findById(testDrone._id);
      expect(deletedDrone).toBeNull();
    });
  });

  describe('POST /api/drones/missions - Create Mission', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();
    });

    it('TC12: Should create mission successfully', async () => {
      const missionData = {
        orderId: new mongoose.Types.ObjectId().toString(),
        droneId: testDrone._id.toString()
      };

      const response = await request(app)
        .post('/api/drones/missions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(missionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('mission');
      expect(response.body.data.mission).toHaveProperty('status', 'PENDING');
      expect(response.body.data.mission).toHaveProperty('droneId', testDrone._id.toString());

      // Verify mission was saved
      const savedMission = await DeliveryMission.findOne({ droneId: testDrone._id });
      expect(savedMission).toBeTruthy();
    });
  });

  describe('GET /api/drones/missions - Get Restaurant Missions', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();

      // missionNumber will be auto-generated by pre-save hook
      const testOrderId = new mongoose.Types.ObjectId();
      testMission = new DeliveryMission({
        orderId: testOrderId,
        restaurantId: mockUser._id,
        droneId: testDrone._id,
        status: 'PENDING',
        missionNumber: 'MSN000001' // Set manually to avoid hook issues in test
      });
      await testMission.save();
    });

    it('TC13: Should get restaurant missions successfully', async () => {
      const response = await request(app)
        .get('/api/drones/missions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('missions');
      expect(Array.isArray(response.body.data.missions)).toBe(true);
      expect(response.body.data.missions.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/drones/missions/:id/status - Update Mission Status', () => {
    beforeEach(async () => {
      testDrone = new Drone({
        restaurantId: mockUser._id,
        name: 'Drone_001',
        model: 'DJI',
        status: 'IDLE',
        maxPayloadGrams: 1000,
        maxRangeMeters: 5000
      });
      await testDrone.save();

      // missionNumber will be auto-generated by pre-save hook
      const testOrderId = new mongoose.Types.ObjectId();
      testMission = new DeliveryMission({
        orderId: testOrderId,
        restaurantId: mockUser._id,
        droneId: testDrone._id,
        status: 'PENDING',
        missionNumber: 'MSN000001' // Set manually to avoid hook issues in test
      });
      await testMission.save();
    });

    it('TC14: Should update mission status successfully', async () => {
      const updateData = {
        status: 'IN_PROGRESS'
      };

      const response = await request(app)
        .patch(`/api/drones/missions/${testMission._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('mission');
      expect(response.body.data.mission).toHaveProperty('status', 'DELIVERED');

      // Verify database was updated
      const updatedMission = await DeliveryMission.findById(testMission._id);
      expect(updatedMission.status).toBe('DELIVERED');
    });
  });
});

