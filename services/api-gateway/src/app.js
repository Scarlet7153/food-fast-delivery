const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('./config/env');
const logger = require('./utils/logger');

class APIGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.CLIENT_URL,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'API Gateway'
      });
    });

    // Authentication routes (no auth required)
    this.app.use('/api/auth', createProxyMiddleware({
      target: config.AUTH_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '/api/auth'
      }
    }));

    // Protected routes with authentication middleware
    this.app.use('/api', this.authenticateToken.bind(this));

    // User service routes
    this.app.use('/api/users', createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/users': '/api/users'
      }
    }));

    // Restaurant service routes
    this.app.use('/api/restaurants', createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/restaurants': '/api/restaurants'
      }
    }));

    // Order service routes
    this.app.use('/api/orders', createProxyMiddleware({
      target: config.ORDER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/orders': '/api/orders'
      }
    }));

    // Drone service routes
    this.app.use('/api/drones', createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/drones': '/api/drones'
      }
    }));

    // Payment service routes
    this.app.use('/api/payments', createProxyMiddleware({
      target: config.PAYMENT_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/payments': '/api/payments'
      }
    }));

    // Notification service routes
    this.app.use('/api/notifications', createProxyMiddleware({
      target: config.NOTIFICATION_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/notifications': '/api/notifications'
      }
    }));

    // Admin routes
    this.app.use('/api/admin', createProxyMiddleware({
      target: config.USER_SERVICE_URL, // Admin functionality in user service
      changeOrigin: true,
      pathRewrite: {
        '^/api/admin': '/api/admin'
      }
    }));
  }

  async authenticateToken(req, res, next) {
    // Skip authentication for auth routes
    if (req.path.startsWith('/auth')) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      // Verify token with auth service
      const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.valid) {
        req.user = response.data.user;
        next();
      } else {
        return res.status(403).json({ message: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      return res.status(403).json({ message: 'Token verification failed' });
    }
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl 
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('API Gateway Error:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: config.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  start() {
    this.app.listen(config.PORT, () => {
      logger.info(`API Gateway running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health Check: http://localhost:${config.PORT}/health`);
    });
  }
}

// Start the API Gateway
const gateway = new APIGateway();
gateway.start();

module.exports = gateway;
