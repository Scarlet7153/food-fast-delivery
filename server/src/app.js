const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/env');
const database = require('./config/database');
const loadExpress = require('./loaders/express');
const logger = require('./utils/logger');
const socketHandler = require('./sockets');

// Import routes
const authRoutes = require('./routes/auth.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const droneRoutes = require('./routes/drone.routes');
const missionRoutes = require('./routes/mission.routes');
const adminRoutes = require('./routes/admin.routes');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

class Application {
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
  }

  async initialize() {
    try {
      // Load Express middleware
      loadExpress(this.app);

      // Connect to database
      await database.connect();

      // Setup Socket.IO
      socketHandler(this.io);

      // Setup routes
      this.setupRoutes();

      // Error handling middleware (must be last)
      this.app.use(notFound);
      this.app.use(errorHandler);

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/restaurants', restaurantRoutes);
    this.app.use('/api/restaurant/menu', menuRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/restaurant/drones', droneRoutes);
    this.app.use('/api/restaurant/missions', missionRoutes);
    this.app.use('/api/admin', adminRoutes);

    logger.info('API routes configured');
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`API Documentation: http://localhost:${config.PORT}/api`);
        logger.info(`Health Check: http://localhost:${config.PORT}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down server...');
    
    try {
      // Close HTTP server
      await new Promise((resolve) => {
        this.server.close(resolve);
      });

      // Disconnect from database
      await database.disconnect();

      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

module.exports = app;

