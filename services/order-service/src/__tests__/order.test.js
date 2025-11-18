const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../models/Order');
const orderRoutes = require('../routes/order.routes');
const axios = require('axios');

// Mock axios for user service verification and restaurant service
jest.mock('axios');

describe('Order Service - Order Management', () => {
  let app;
  let testOrder;
  let authToken;
  let mongoServer;
  let mockUser;
  let mockRestaurant;

  beforeAll(async () => {
    jest.setTimeout(30000);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);

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
      email: 'customer@example.com',
      role: 'customer',
      name: 'Test Customer'
    };

    mockRestaurant = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Restaurant',
      description: 'Test restaurant description',
      imageUrl: 'https://example.com/image.jpg',
      phone: '0123456789',
      active: true,
      approved: true
    };

    // Mock axios for user verification and restaurant service
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
      // Match restaurant endpoint: /api/restaurants/{id} but not /owner/ or /internal/
      if (url.includes('/api/restaurants/') && 
          !url.includes('/owner/') && 
          !url.includes('/internal/') &&
          !url.includes('/rating')) {
        // Use a consistent menuItemId for all tests
        const menuItemId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        return Promise.resolve({
          data: {
            success: true,
            data: {
              restaurant: {
                _id: mockRestaurant._id.toString(),
                name: mockRestaurant.name,
                description: mockRestaurant.description,
                imageUrl: mockRestaurant.imageUrl,
                phone: mockRestaurant.phone,
                active: true,
                approved: true
              },
              menuItems: [
                {
                  _id: menuItemId.toString(),
                  name: 'Bánh Mỳ',
                  price: 25000,
                  available: true,
                  imageUrl: ''
                }
              ]
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  }, 30000);

  afterAll(async () => {
    try {
      await Order.deleteMany({});
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
    await Order.deleteMany({});
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
      // Match restaurant endpoint: /api/restaurants/{id} but not /owner/ or /internal/
      if (url.includes('/api/restaurants/') && 
          !url.includes('/owner/') && 
          !url.includes('/internal/') &&
          !url.includes('/rating')) {
        const menuItemId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        return Promise.resolve({
          data: {
            success: true,
            data: {
              restaurant: {
                _id: mockRestaurant._id.toString(),
                name: mockRestaurant.name,
                description: mockRestaurant.description,
                imageUrl: mockRestaurant.imageUrl,
                phone: mockRestaurant.phone,
                active: true,
                approved: true
              },
              menuItems: [
                {
                  _id: menuItemId.toString(),
                  name: 'Bánh Mỳ',
                  price: 25000,
                  available: true,
                  imageUrl: ''
                }
              ]
            }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  describe('POST /api/orders - Create Order', () => {
    it('TC1: Should create order successfully', async () => {
      // Use the same menuItemId that's returned by the mock restaurant service
      const menuItemId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      
      const orderData = {
        restaurantId: mockRestaurant._id.toString(),
        items: [
          {
            menuItemId: menuItemId.toString(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order).toHaveProperty('userId', mockUser._id.toString());
      expect(response.body.data.order).toHaveProperty('restaurantId', mockRestaurant._id.toString());
      expect(response.body.data.order).toHaveProperty('status');

      // Verify order was saved
      const savedOrder = await Order.findOne({ userId: mockUser._id });
      expect(savedOrder).toBeTruthy();
      expect(savedOrder.amount.total).toBe(35000);
    });

    it('TC2: Should reject order creation for inactive restaurant', async () => {
      const inactiveRestaurant = {
        _id: mockRestaurant._id.toString(),
        name: mockRestaurant.name,
        description: mockRestaurant.description,
        imageUrl: mockRestaurant.imageUrl,
        phone: mockRestaurant.phone,
        active: false,
        approved: true
      };

      // Reset and override the mock implementation for this test
      axios.get.mockReset();
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
        // Match restaurant endpoint: /api/restaurants/{id} but not /owner/ or /internal/
        if (url.includes('/api/restaurants/') && 
            !url.includes('/owner/') && 
            !url.includes('/internal/') &&
            !url.includes('/rating')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                restaurant: inactiveRestaurant,
                menuItems: []
              }
            }
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const orderData = {
        restaurantId: inactiveRestaurant._id.toString(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId().toString(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      // Validation will fail first, or business logic will reject
      expect(response.body.error).toBeTruthy();
    });

    it('TC3: Should reject order creation with COD payment method', async () => {
      const orderData = {
        restaurantId: mockRestaurant._id.toString(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId().toString(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        payment: {
          method: 'COD',
          status: 'UNPAID'
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      // Validation will reject COD method (only MOMO allowed)
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /api/orders/user - Get User Orders', () => {
    beforeEach(async () => {
      // Create test orders
      testOrder = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        status: 'PENDING_PAYMENT'
      });
      await testOrder.save();

      const order2 = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Pizza',
            quantity: 1,
            price: 55000,
            totalPrice: 55000
          }
        ],
        deliveryAddress: {
          text: '519/79 Âu Cơ, Phú Trung, Tân Phú, Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 55000,
          deliveryFee: 10000,
          total: 65000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'PAID'
        },
        status: 'CONFIRMED'
      });
      await order2.save();
    });

    it('TC4: Should get user orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.orders.length).toBeGreaterThan(0);
    });

    it('TC5: Should reject request without token', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/orders/:id - Get Order By ID', () => {
    beforeEach(async () => {
      testOrder = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        status: 'PENDING_PAYMENT'
      });
      await testOrder.save();
    });

    it('TC6: Should get order by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order).toHaveProperty('_id', testOrder._id.toString());
      expect(response.body.data.order).toHaveProperty('status', 'PENDING_PAYMENT');
    });

    it('TC7: Should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/orders/:id/status - Update Order Status', () => {
    beforeEach(async () => {
      testOrder = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        status: 'PENDING_PAYMENT'
      });
      await testOrder.save();
    });

    it('TC8: Should update order status successfully', async () => {
      const updateData = {
        status: 'PLACED'
      };

      const response = await request(app)
        .patch(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order).toHaveProperty('status', 'PLACED');

      // Verify database was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('PLACED');
    });
  });

  describe('PATCH /api/orders/:id/cancel - Cancel Order', () => {
    beforeEach(async () => {
      testOrder = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        status: 'PENDING_PAYMENT'
      });
      await testOrder.save();
    });

    it('TC9: Should cancel order successfully', async () => {
      const cancelData = {
        reason: 'Changed my mind'
      };

      const response = await request(app)
        .patch(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancelData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('order');

      // Verify order was cancelled
      const cancelledOrder = await Order.findById(testOrder._id);
      expect(cancelledOrder.status).toBe('CANCELLED');
    });
  });

  describe('GET /api/orders/restaurant/orders - Get Restaurant Orders', () => {
    let restaurantUser;

    beforeEach(async () => {
      restaurantUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'restaurant@example.com',
        role: 'restaurant',
        name: 'Restaurant Owner'
      };

      const mockRestaurantId = mockRestaurant._id;
      
      // Mock restaurant user and restaurant service
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/user/verify')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                user: restaurantUser
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
                  _id: mockRestaurantId
                }
              }
            }
          });
        }
        if (url.includes('/api/restaurants/')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                restaurant: mockRestaurant,
                menuItems: []
              }
            }
          });
        }
      });

      testOrder = new Order({
        userId: mockUser._id,
        restaurantId: mockRestaurant._id,
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Bánh Mỳ',
            quantity: 1,
            price: 25000,
            totalPrice: 25000
          }
        ],
        deliveryAddress: {
          text: '273 An Dương Vương, Chợ Quán, Quận 5, Thành phố Hồ Chí Minh',
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
          },
          contactPhone: '0352773474',
          contactName: 'Võ Duy Toàn',
          notes: ''
        },
        amount: {
          subtotal: 25000,
          deliveryFee: 10000,
          total: 35000,
          currency: 'VND',
          tax: 0,
          discount: 0
        },
        payment: {
          method: 'MOMO',
          status: 'UNPAID'
        },
        status: 'PENDING_PAYMENT'
      });
      await testOrder.save();
    });

    it('TC10: Should get restaurant orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('TC11: Should reject request from non-restaurant user', async () => {
      // Reset to customer user
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
        .get('/api/orders/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

