const request = require('supertest');
const express = require('express');

describe('User Service App', () => {
  let app;

  beforeAll(() => {
    // Create a simple test app that mimics the service structure
    app = express();
    app.use(express.json());
    
    // Health check route
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'User Service'
      });
    });

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

  describe('Health Check', () => {
    it('should return 200 and service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'User Service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Route not found');
      expect(response.body).toHaveProperty('path');
    });
  });
<<<<<<< Updated upstream
  });
=======
  // Test fail
  describe('test fail', () => {
    it('should fail to verify CI/CD pipeline', () => {
      expect(1).toBe(2); // This will always fail
    });
  });
});
>>>>>>> Stashed changes

