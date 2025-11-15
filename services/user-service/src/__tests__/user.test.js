const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const userRoutes = require('../routes/user.routes');

describe('User Service - User Management', () => {
  let app;
  let testUser;
  let authToken;
  let mongoServer;

  beforeAll(async () => {
    // Increase timeout for database connection
    jest.setTimeout(30000); // 30 seconds

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/user', userRoutes);

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }, 30000); // 30 second timeout for beforeAll

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({});
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      if (mongoServer) {
        await mongoServer.stop();
      }
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  }, 30000); // 30 second timeout for afterAll

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
  });

  describe('POST /api/user/register - User Registration', () => {
    it('TC1: Should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).toHaveProperty('role', 'customer');

      // Verify user was saved in database
      const savedUser = await User.findOne({ email: 'test@example.com' });
      expect(savedUser).toBeTruthy();
      expect(savedUser.email).toBe('test@example.com');
    });

    it('TC2: Should reject registration with duplicate email', async () => {
      // Create existing user
      const existingUser = new User({
        name: 'Existing User',
        email: 'existing@example.com',
        phone: '0987654321',
        password: 'password123',
        role: 'customer'
      });
      await existingUser.save();

      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Email này đã được sử dụng');
    });

    it('TC3: Should reject registration with duplicate phone', async () => {
      // Create existing user
      const existingUser = new User({
        name: 'Existing User',
        email: 'existing@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      });
      await existingUser.save();

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Số điện thoại này đã được đăng ký');
    });
  });

  describe('POST /api/user/login - User Login', () => {
    beforeEach(async () => {
      // Create test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      });
      await testUser.save();
    });

    it('TC3: Should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');

      authToken = response.body.data.accessToken;
    });

    it('TC4: Should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBeTruthy();
    });

    it('TC4: Should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /api/user/me - Get User Profile', () => {
    beforeEach(async () => {
      // Create and login test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      });
      await testUser.save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      authToken = loginResponse.body.data.accessToken;
    });

    it('TC5: Should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('refreshTokens');
    });

    it('TC5: Should reject request without token', async () => {
      const response = await request(app)
        .get('/api/user/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/profile - Update User Profile', () => {
    beforeEach(async () => {
      // Create and login test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      });
      await testUser.save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      authToken = loginResponse.body.data.accessToken;
    });

    it('TC6: Should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '0987654321',
        address: {
          text: '123 Test Street'
        }
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('name', 'Updated Name');
      expect(response.body.data.user).toHaveProperty('phone', '0987654321');

      // Verify database was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.phone).toBe('0987654321');
    });
  });

  describe('POST /api/user/payment-info - Create Payment Info', () => {
    beforeEach(async () => {
      // Create and login test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        role: 'customer'
      });
      await testUser.save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      authToken = loginResponse.body.data.accessToken;
    });

    it('TC7: Should create payment info successfully', async () => {
      const paymentInfoData = {
        contactInfo: {
          name: 'Test User',
          phone: '0123456789'
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1'
        },
        isDefault: true
      };

      const response = await request(app)
        .post('/api/user/payment-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentInfoData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('paymentInfo');
      expect(response.body.data.paymentInfo).toHaveProperty('contactInfo');
      expect(response.body.data.paymentInfo).toHaveProperty('deliveryAddress');

      // Verify payment info was saved
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.paymentInfo).toHaveLength(1);
      expect(updatedUser.paymentInfo[0].contactInfo.name).toBe('Test User');
    });
  });
});

