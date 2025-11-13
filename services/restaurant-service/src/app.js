const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const database = require('./config/database');
const logger = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');

// Import routes
const restaurantRoutes = require('./routes/restaurant.routes');
const adminRoutes = require('./routes/admin.routes');
const internalRoutes = require('./routes/internal.routes');

class RestaurantService {
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

    // Prometheus metrics middleware
    this.app.use(metricsMiddleware('restaurant-service'));

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
        service: 'Restaurant Service'
      });
    });

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        logger.error('Error generating metrics:', error);
        res.status(500).end();
      }
    });

    // API routes
    this.app.use('/api/restaurants', restaurantRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/internal', internalRoutes);

    logger.info('Restaurant routes configured');
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
      logger.error('Restaurant Service Error:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: config.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  async start() {
    try {
      // Connect to database
      await database.connect();

      this.app.listen(config.PORT, () => {
        logger.info(`Restaurant Service running on port ${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`Health Check: http://localhost:${config.PORT}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start Restaurant Service:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down Restaurant Service...');
    
    try {
      // Disconnect from database
      await database.disconnect();
      logger.info('Restaurant Service shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the Restaurant Service
const restaurantService = new RestaurantService();
restaurantService.start().catch((error) => {
  logger.error('Failed to start Restaurant Service:', error);
  process.exit(1);
});

module.exports = restaurantService;
