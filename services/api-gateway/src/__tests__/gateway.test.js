const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Mock axios for user service verification
jest.mock('axios');
jest.mock('http-proxy-middleware');

describe('API Gateway - Routing and Authentication', () => {
  let app;
  let authToken;
  let mockUser;

  beforeAll(() => {
    // Setup mock user
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'customer',
      name: 'Test User'
    };

    authToken = 'mock-token';

    // Create test app with simplified gateway logic
    app = express();
    app.use(express.json());

    // Mock authenticateToken middleware
    const authenticateToken = async (req, res, next) => {
      // Skip authentication for user routes
      if (req.path.startsWith('/api/user')) {
        return next();
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Access token required' 
        });
      }

      try {
        // Mock user verification
        const response = await axios.get('http://localhost:3002/api/user/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          req.user = response.data.data.user;
          next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Invalid token'
          });
        }
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed'
        });
      }
    };

    // Health check route
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'API Gateway'
      });
    });

    // Mock proxy middleware - just pass through
    const mockProxy = (req, res, next) => {
      // Simulate proxy behavior
      res.json({
        success: true,
        message: 'Proxied request',
        path: req.path,
        method: req.method
      });
    };

    // User routes (no auth required for register/login)
    app.use('/api/user', mockProxy);

    // Protected routes
    app.use('/api/orders', authenticateToken, mockProxy);
    app.use('/api/restaurants', authenticateToken, mockProxy);
    app.use('/api/payments', (req, res, next) => {
      // Allow /methods without authentication
      if (req.path === '/methods') {
        return next();
      }
      return authenticateToken(req, res, next);
    }, mockProxy);
    app.use('/api/drones', authenticateToken, mockProxy);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
      });
    });

    // Error handler
    app.use((error, req, res, next) => {
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  });

  beforeEach(() => {
    // Reset axios mocks
    axios.get.mockClear();
  });

  describe('Health Check', () => {
    it('TC1: Should return 200 and service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'API Gateway');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('User Routes - No Authentication Required', () => {
    it('TC2: Should allow access to user routes without token', async () => {
      const response = await request(app)
        .get('/api/user/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('path', '/test');
    });

    it('TC3: Should allow POST to user register without token', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Protected Routes - Authentication Required', () => {
    beforeEach(() => {
      // Mock successful token verification
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: mockUser
          }
        }
      });
    });

    it('TC4: Should allow access to protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3002/api/user/verify',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${authToken}`
          })
        })
      );
    });

    it('TC5: Should reject access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access token required');
    });

    it('TC6: Should reject access to protected routes with invalid token', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          success: false
        }
      });

      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('TC7: Should reject access when token verification fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token verification failed');
    });
  });

  describe('Payment Routes - Conditional Authentication', () => {
    it('TC8: Should allow access to /api/payments/methods without token', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('TC9: Should require authentication for other payment routes', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: mockUser
          }
        }
      });

      const response = await request(app)
        .get('/api/payments/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(axios.get).toHaveBeenCalled();
    });

    it('TC10: Should reject payment routes without token (except /methods)', async () => {
      const response = await request(app)
        .get('/api/payments/user')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Route Proxying', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: mockUser
          }
        }
      });
    });

    it('TC11: Should proxy orders routes correctly', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('path', '/user');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('TC12: Should proxy restaurants routes correctly', async () => {
      const response = await request(app)
        .get('/api/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('path', '/');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('TC13: Should proxy drones routes correctly', async () => {
      const response = await request(app)
        .get('/api/drones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('path', '/');
      expect(response.body).toHaveProperty('method', 'GET');
    });
  });

  describe('404 Handler', () => {
    it('TC14: Should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Route not found');
      expect(response.body).toHaveProperty('path', '/unknown-route');
    });
  });

  describe('Error Handling', () => {
    it('TC15: Should handle errors gracefully', async () => {
      // Create a route that throws an error - add it before 404 handler
      // We need to add it before the 404 handler in the app setup
      const errorTestApp = express();
      errorTestApp.use(express.json());
      
      // Add error route before 404 handler
      errorTestApp.get('/api/error-test', (req, res, next) => {
        throw new Error('Test error');
      });
      
      // 404 handler
      errorTestApp.use('*', (req, res) => {
        res.status(404).json({
          message: 'Route not found',
          path: req.originalUrl
        });
      });
      
      // Error handler (must be last)
      errorTestApp.use((error, req, res, next) => {
        res.status(500).json({
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
      });

      const response = await request(errorTestApp)
        .get('/api/error-test')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('Request Method Handling', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: mockUser
          }
        }
      });
    });

    it('TC16: Should handle GET requests', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('TC17: Should handle POST requests', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ test: 'data' })
        .expect(200);

      expect(response.body).toHaveProperty('method', 'POST');
    });

    it('TC18: Should handle PUT requests', async () => {
      const response = await request(app)
        .put('/api/restaurants/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('method', 'PUT');
    });

    it('TC19: Should handle PATCH requests', async () => {
      const response = await request(app)
        .patch('/api/orders/123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body).toHaveProperty('method', 'PATCH');
    });

    it('TC20: Should handle DELETE requests', async () => {
      const response = await request(app)
        .delete('/api/drones/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('method', 'DELETE');
    });
  });
});

