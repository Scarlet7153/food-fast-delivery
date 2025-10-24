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
    this.authLimiter = null; // Initialize authLimiter
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

    // Rate limiting - General
    const generalLimiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    });

    // Rate limiting - Auth routes (more lenient)
    this.authLimiter = rateLimit({
      windowMs: 60000, // 1 minute
      max: 20, // 20 requests per minute for auth
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true // Don't count successful requests
    });

    // Apply general rate limiting to all routes
    this.app.use(generalLimiter);

    // Body parsing - SKIP for /api routes (let proxy handle it)
    // this.app.use(express.json({ limit: '10mb' }));
    // this.app.use(express.urlencoded({ extended: true }));

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

    // User routes (no auth required for register/login) - now handled by User Service
    this.app.use('/api/user', this.authLimiter, createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        logger.info(`[API Gateway] Proxying ${req.method} ${req.path} to ${config.USER_SERVICE_URL}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info(`[API Gateway] Received response from User Service: ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        logger.error('[API Gateway] Proxy error:', err);
        res.status(504).json({ 
          success: false, 
          error: 'Gateway timeout',
          message: 'The upstream service did not respond in time'
        });
      }
    }));

    // User service routes (protected)
    this.app.use('/api/users', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/users': '/api/users'
      }
    }));

    // User profile routes (protected)
    this.app.use('/api/user/me', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/user/me': '/api/user/me'
      }
    }));

    this.app.use('/api/user/profile', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/user/profile': '/api/user/profile'
      }
    }));

    this.app.use('/api/user/change-password', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/user/change-password': '/api/user/change-password'
      }
    }));

    // ===== ADMIN ROUTES (MUST BE FIRST TO AVOID CONFLICTS) =====
    
    // Admin routes (protected) - Order specific routes first
    this.app.use('/api/admin/orders/all', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.ORDER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/orders/all': '/api/admin/orders/all'
      }
    }));

    this.app.use('/api/admin/orders', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.ORDER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/orders': '/api/admin/orders'
      }
    }));

    // Admin restaurant routes
    this.app.use('/api/admin/restaurants/pending', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/restaurants/pending': '/api/admin/restaurants/pending'
      }
    }));

    this.app.use('/api/admin/restaurants', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/restaurants': '/api/admin/restaurants'
      }
    }));

    // Admin drone routes
    this.app.use('/api/admin/drones', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/drones': '/api/admin/drones'
      }
    }));

    // Admin mission routes
    this.app.use('/api/admin/missions', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/missions': '/api/admin/missions'
      }
    }));

    // Admin analytics routes
    this.app.use('/api/admin/analytics', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/analytics': '/api/admin/analytics'
      }
    }));

    // Admin system routes
    this.app.use('/api/admin/system', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin/system': '/api/admin/system'
      }
    }));

    // General admin routes (must be last)
    this.app.use('/api/admin', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.USER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/admin': '/api/admin'
      }
    }));

    // ===== PUBLIC ROUTES =====
    
    // Restaurant service routes (public - for customer browsing)
    this.app.use('/api/restaurants', createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurants': '/api/restaurants'
      },
      // Skip protected routes - they will be handled by protected routes below
      pathFilter: (pathname, req) => {
        // Allow GET requests (public browsing)
        if (req.method === 'GET') return true
        // Skip POST/PUT/DELETE for restaurant owners - handled by protected routes
        return false
      }
    }));

    // Menu routes (public)
    this.app.use('/api/menu', createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/menu': '/api/menu'
      }
    }));
    
    // Restaurant menu search routes (public)
    this.app.use('/api/restaurants/menu', createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurants/menu': '/api/restaurants/menu'
      }
    }));

    // Restaurant menu routes (backward compatibility)
    this.app.use('/api/restaurant/menu', createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurant/menu': '/api/restaurant/menu'
      }
    }));

    // ===== PROTECTED ROUTES =====
    
    // Restaurant-specific order routes (protected)
    this.app.use('/api/orders/restaurant', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.ORDER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/orders/restaurant': '/api/orders/restaurant'
      }
    }));
    
    // Order service routes (protected)
    this.app.use('/api/orders', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.ORDER_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/orders': '/api/orders'
      }
    }));

    // Drone service routes (protected)
    this.app.use('/api/drones', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/drones': '/api/drones'
      }
    }));

    // Restaurant drone routes (protected)
    this.app.use('/api/restaurant/drones', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurant/drones': '/api/drones'
      }
    }));

    // Restaurant mission routes (protected)
    this.app.use('/api/restaurant/missions', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.DRONE_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurant/missions': '/api/drones/missions'
      }
    }));

    // Restaurant owner routes (protected)
    this.app.use('/api/restaurants', this.authenticateToken.bind(this), createProxyMiddleware({
      target: config.RESTAURANT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/restaurants': '/api/restaurants'
      },
      // Handle POST/PUT/DELETE requests and GET /me (restaurant owner operations)
      pathFilter: (pathname, req) => {
        // Allow GET /me for restaurant owners to get their restaurant
        if (req.method === 'GET' && pathname.includes('/me')) {
          return true;
        }
        return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      }
    }));
    
    // Payment service routes (protected, except /methods)
    this.app.use('/api/payments', (req, res, next) => {
      // Allow /methods without authentication
      if (req.path === '/methods') {
        return next();
      }
      // Require authentication for other payment routes
      return this.authenticateToken(req, res, next);
    }, createProxyMiddleware({
      target: config.PAYMENT_SERVICE_URL,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/payments': '/api/payments'
      }
    }));
  }

  async authenticateToken(req, res, next) {
    // Skip authentication for user routes (handled by User Service)
    if (req.path.startsWith('/user')) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      // Verify token with user service
      const response = await axios.get(`${config.USER_SERVICE_URL}/api/user/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        req.user = response.data.data.user;
        next();
      } else {
        return res.status(403).json({ message: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Token verification failed:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        token: token ? `${token.substring(0, 20)}...` : 'null'
      });
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
