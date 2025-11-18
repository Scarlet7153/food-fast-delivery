const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Payment = require('../models/Payment');
const paymentRoutes = require('../routes/payment.routes');
const axios = require('axios');
const momoService = require('../services/momo.service');

// Mock axios for user service verification and order service
jest.mock('axios');
jest.mock('../services/momo.service');

describe('Payment Service - Payment Management', () => {
  let app;
  let testPayment;
  let authToken;
  let mongoServer;
  let mockUser;
  let mockRestaurantOwner;
  let mockOrder;

  beforeAll(async () => {
    jest.setTimeout(30000);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentRoutes);

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
      name: 'Test Customer',
      phone: '0123456789'
    };

    mockRestaurantOwner = {
      _id: new mongoose.Types.ObjectId(),
      email: 'restaurant@example.com',
      role: 'restaurant',
      name: 'Restaurant Owner'
    };

    mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      userId: mockUser._id,
      restaurantId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD001',
      status: 'PLACED',
      amount: {
        total: 35000,
        subtotal: 25000,
        deliveryFee: 10000,
        tax: 0,
        discount: 0,
        currency: 'VND'
      },
      items: [
        {
          name: 'Bánh Mỳ',
          quantity: 1,
          price: 25000
        }
      ],
      deliveryAddress: {
        text: '123 Test Street',
        contactPhone: '0123456789'
      }
    };

    // Mock axios for user verification and order service
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
      if (url.includes('/api/internal/orders/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              order: mockOrder
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    // Mock momo service
    momoService.createPaymentRequest = jest.fn().mockResolvedValue({
      success: true,
      data: {
        requestId: 'mock-request-id',
        transId: 'mock-trans-id',
        payUrl: 'https://test.momo.vn/pay',
        qrCodeUrl: 'https://test.momo.vn/qr',
        deeplink: 'momo://pay',
        applink: 'https://test.momo.vn/app',
        signature: 'mock-signature',
        resultCode: 0,
        responseTime: new Date().toISOString()
      }
    });

    momoService.verifyPayment = jest.fn().mockResolvedValue({
      success: true,
      data: {
        resultCode: 0,
        message: 'Success'
      }
    });
  }, 30000);

  afterAll(async () => {
    try {
      await Payment.deleteMany({});
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
    await Payment.deleteMany({});
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
              user: mockUser
            }
          }
        });
      }
      if (url.includes('/api/internal/orders/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              order: mockOrder
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    // Reset momo service mocks
    momoService.createPaymentRequest.mockClear();
    momoService.createPaymentRequest.mockResolvedValue({
      success: true,
      data: {
        requestId: 'mock-request-id',
        transId: 'mock-trans-id',
        payUrl: 'https://test.momo.vn/pay',
        qrCodeUrl: 'https://test.momo.vn/qr',
        deeplink: 'momo://pay',
        applink: 'https://test.momo.vn/app',
        signature: 'mock-signature',
        resultCode: 0,
        responseTime: new Date().toISOString()
      }
    });
  });

  describe('POST /api/payments/create - Create Payment', () => {
    it('TC1: Should create payment successfully', async () => {
      const paymentData = {
        orderId: mockOrder._id.toString(),
        method: 'MOMO'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data).toHaveProperty('paymentUrl');
      expect(response.body.data.payment).toHaveProperty('orderId', mockOrder._id.toString());
      expect(response.body.data.payment).toHaveProperty('userId', mockUser._id.toString());
      expect(response.body.data.payment).toHaveProperty('status', 'PROCESSING');
      expect(response.body.data.payment).toHaveProperty('method', 'MOMO');

      // Verify payment was saved
      const savedPayment = await Payment.findOne({ orderId: mockOrder._id });
      expect(savedPayment).toBeTruthy();
      expect(savedPayment.amount.total).toBe(35000);
    });

    it('TC2: Should reject payment creation for non-existent order', async () => {
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
        if (url.includes('/api/internal/orders/')) {
          return Promise.reject({
            response: {
              status: 404,
              data: { error: 'Order not found' }
            }
          });
        }
      });

      const paymentData = {
        orderId: new mongoose.Types.ObjectId().toString(),
        method: 'MOMO'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Order not found');
    });

    it('TC3: Should reject payment creation for order not owned by user', async () => {
      const otherUserOrder = {
        ...mockOrder,
        userId: new mongoose.Types.ObjectId()
      };

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
        if (url.includes('/api/internal/orders/')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                order: otherUserOrder
              }
            }
          });
        }
      });

      const paymentData = {
        orderId: otherUserOrder._id.toString(),
        method: 'MOMO'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('permission');
    });

    it('TC4: Should reject payment creation for order in wrong status', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: 'CANCELLED'
      };

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
        if (url.includes('/api/internal/orders/')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                order: cancelledOrder
              }
            }
          });
        }
      });

      const paymentData = {
        orderId: cancelledOrder._id.toString(),
        method: 'MOMO'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('payable state');
    });

    it('TC5: Should reject payment creation without token', async () => {
      const paymentData = {
        orderId: mockOrder._id.toString(),
        method: 'MOMO'
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/payments/user - Get User Payments', () => {
    beforeEach(async () => {
      // Create test payments
      testPayment = new Payment({
        orderId: mockOrder._id,
        userId: mockUser._id,
        restaurantId: mockOrder.restaurantId,
        method: 'MOMO',
        status: 'COMPLETED',
        amount: {
          total: 35000,
          currency: 'VND',
          breakdown: {
            subtotal: 25000,
            deliveryFee: 10000,
            tax: 0,
            discount: 0
          }
        },
        metadata: {
          customerInfo: {
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone
          }
        }
      });
      await testPayment.save();

      const payment2 = new Payment({
        orderId: new mongoose.Types.ObjectId(),
        userId: mockUser._id,
        restaurantId: mockOrder.restaurantId,
        method: 'MOMO',
        status: 'PENDING',
        amount: {
          total: 50000,
          currency: 'VND',
          breakdown: {
            subtotal: 40000,
            deliveryFee: 10000,
            tax: 0,
            discount: 0
          }
        }
      });
      await payment2.save();
    });

    it('TC6: Should get user payments successfully', async () => {
      const response = await request(app)
        .get('/api/payments/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payments');
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeGreaterThan(0);
    });

    it('TC7: Should filter user payments by status', async () => {
      const response = await request(app)
        .get('/api/payments/user?status=COMPLETED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.payments.length).toBeGreaterThan(0);
      response.body.data.payments.forEach(payment => {
        expect(payment.status).toBe('COMPLETED');
      });
    });
  });

  describe('GET /api/payments/:id - Get Payment By ID', () => {
    beforeEach(async () => {
      testPayment = new Payment({
        orderId: mockOrder._id,
        userId: mockUser._id,
        restaurantId: mockOrder.restaurantId,
        method: 'MOMO',
        status: 'COMPLETED',
        amount: {
          total: 35000,
          currency: 'VND',
          breakdown: {
            subtotal: 25000,
            deliveryFee: 10000,
            tax: 0,
            discount: 0
          }
        }
      });
      await testPayment.save();
    });

    it('TC8: Should get payment by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data.payment).toHaveProperty('_id', testPayment._id.toString());
      expect(response.body.data.payment).toHaveProperty('orderId', mockOrder._id.toString());
    });

    it('TC9: Should return 404 for non-existent payment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('TC10: Should reject access to payment not owned by user', async () => {
      const otherUserPayment = new Payment({
        orderId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(), // Different user
        restaurantId: mockOrder.restaurantId,
        method: 'MOMO',
        status: 'COMPLETED',
        amount: {
          total: 35000,
          currency: 'VND',
          breakdown: {
            subtotal: 25000,
            deliveryFee: 10000,
            tax: 0,
            discount: 0
          }
        }
      });
      await otherUserPayment.save();

      const response = await request(app)
        .get(`/api/payments/${otherUserPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('permission');
    });
  });

  describe('GET /api/payments/:id/status - Check Payment Status', () => {
    beforeEach(async () => {
      testPayment = new Payment({
        orderId: mockOrder._id,
        userId: mockUser._id,
        restaurantId: mockOrder.restaurantId,
        method: 'MOMO',
        status: 'PROCESSING',
        amount: {
          total: 35000,
          currency: 'VND',
          breakdown: {
            subtotal: 25000,
            deliveryFee: 10000,
            tax: 0,
            discount: 0
          }
        },
        momo: {
          transId: 'mock-trans-id',
          requestId: 'mock-request-id'
        }
      });
      await testPayment.save();
    });

    it('TC11: Should get payment status successfully', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPayment._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data.payment).toHaveProperty('status', 'PROCESSING');
    });
  });
});
