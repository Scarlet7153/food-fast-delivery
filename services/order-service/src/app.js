const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const database = require('./config/database');
const logger = require('./utils/logger');

// Import routes
const orderRoutes = require('./routes/order.routes');

class OrderService {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
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
        service: 'Order Service'
      });
    });

    // API routes
    this.app.use('/api/orders', orderRoutes);

    logger.info('Order routes configured');
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Join user-specific room
      socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} joined socket room`);
      });

      // Join restaurant-specific room
      socket.on('join-restaurant', (restaurantId) => {
        socket.join(`restaurant-${restaurantId}`);
        logger.info(`Restaurant ${restaurantId} joined socket room`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // Make io available to other parts of the app
    this.app.set('io', this.io);
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
      logger.error('Order Service Error:', error);
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

      this.server.listen(config.PORT, () => {
        logger.info(`Order Service running on port ${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`Health Check: http://localhost:${config.PORT}/health`);
        logger.info(`Socket.IO: http://localhost:${config.PORT}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start Order Service:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down Order Service...');
    
    try {
      // Close HTTP server
      await new Promise((resolve) => {
        this.server.close(resolve);
      });

      // Disconnect from database
      await database.disconnect();
      logger.info('Order Service shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the Order Service
const orderService = new OrderService();
orderService.start().catch((error) => {
  logger.error('Failed to start Order Service:', error);
  process.exit(1);
});

module.exports = orderService;
