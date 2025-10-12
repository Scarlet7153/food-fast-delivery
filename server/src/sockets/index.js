const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const DeliveryMission = require('../models/DeliveryMission');
const config = require('../config/env');
const logger = require('../utils/logger');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user || !user.active) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Socket handler
const socketHandler = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.user.role})`);

    // Join user-specific room
    socket.join(`user:${socket.user._id}`);

    // Join role-specific rooms
    socket.join(`role:${socket.user.role}`);
    
    // Join restaurant room if user is restaurant owner
    if (socket.user.restaurantId) {
      socket.join(`restaurant:${socket.user.restaurantId}`);
    }

    // Handle order tracking
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.info(`User ${socket.user.email} joined order room: ${orderId}`);
    });

    // Handle mission tracking
    socket.on('join:mission', (missionId) => {
      socket.join(`mission:${missionId}`);
      logger.info(`User ${socket.user.email} joined mission room: ${missionId}`);
    });

    // Handle restaurant dashboard
    socket.on('join:restaurant:dashboard', () => {
      if (socket.user.restaurantId) {
        socket.join(`restaurant:dashboard:${socket.user.restaurantId}`);
        logger.info(`User ${socket.user.email} joined restaurant dashboard`);
      }
    });

    // Handle admin dashboard
    socket.on('join:admin:dashboard', () => {
      if (socket.user.role === 'admin') {
        socket.join('admin:dashboard');
        logger.info(`Admin ${socket.user.email} joined admin dashboard`);
      }
    });

    // Handle location updates (for drones)
    socket.on('drone:location', async (data) => {
      try {
        const { droneId, latitude, longitude, altitude, heading, speed, batteryPercent } = data;
        
        // Verify user owns the drone
        if (socket.user.role !== 'restaurant' || !socket.user.restaurantId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Emit to restaurant room
        socket.to(`restaurant:${socket.user.restaurantId}`).emit('drone:location:update', {
          droneId,
          latitude,
          longitude,
          altitude,
          heading,
          speed,
          batteryPercent,
          timestamp: new Date()
        });

        logger.debug(`Drone location update: ${droneId} - ${latitude}, ${longitude}`);
      } catch (error) {
        logger.error('Drone location update error:', error);
        socket.emit('error', { message: 'Failed to update drone location' });
      }
    });

    // Handle order status updates
    socket.on('order:status:update', async (data) => {
      try {
        const { orderId, status, note } = data;
        
        // Verify user has permission to update this order
        const order = await Order.findById(orderId);
        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        const canUpdate = 
          (socket.user.role === 'restaurant' && order.restaurantId.toString() === socket.user.restaurantId.toString()) ||
          (socket.user.role === 'customer' && order.userId.toString() === socket.user._id.toString()) ||
          socket.user.role === 'admin';

        if (!canUpdate) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        await order.updateStatus(status, socket.user._id, note);

        // Emit to order room
        io.to(`order:${orderId}`).emit('order:status:updated', {
          orderId,
          status,
          note,
          timestamp: new Date(),
          updatedBy: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          }
        });

        // Emit to restaurant room if restaurant updated
        if (socket.user.role === 'restaurant') {
          io.to(`restaurant:${socket.user.restaurantId}`).emit('restaurant:order:updated', {
            orderId,
            status,
            order
          });
        }

        logger.info(`Order status updated: ${orderId} - ${status} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Order status update error:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle mission status updates
    socket.on('mission:status:update', async (data) => {
      try {
        const { missionId, status, note } = data;
        
        // Verify user has permission to update this mission
        const mission = await DeliveryMission.findById(missionId);
        if (!mission) {
          return socket.emit('error', { message: 'Mission not found' });
        }

        const canUpdate = 
          (socket.user.role === 'restaurant' && mission.restaurantId.toString() === socket.user.restaurantId.toString()) ||
          socket.user.role === 'admin';

        if (!canUpdate) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        await mission.updateStatus(status, note);

        // Emit to mission room
        io.to(`mission:${missionId}`).emit('mission:status:updated', {
          missionId,
          status,
          note,
          timestamp: new Date(),
          updatedBy: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          }
        });

        // Emit to order room (if order is associated)
        if (mission.orderId) {
          io.to(`order:${mission.orderId}`).emit('order:mission:updated', {
            orderId: mission.orderId,
            missionId,
            status
          });
        }

        logger.info(`Mission status updated: ${missionId} - ${status} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Mission status update error:', error);
        socket.emit('error', { message: 'Failed to update mission status' });
      }
    });

    // Handle mission path updates
    socket.on('mission:path:update', async (data) => {
      try {
        const { missionId, latitude, longitude, altitude, heading, speed, batteryPercent } = data;
        
        // Verify user has permission to update this mission
        const mission = await DeliveryMission.findById(missionId);
        if (!mission) {
          return socket.emit('error', { message: 'Mission not found' });
        }

        const canUpdate = 
          (socket.user.role === 'restaurant' && mission.restaurantId.toString() === socket.user.restaurantId.toString()) ||
          socket.user.role === 'admin';

        if (!canUpdate) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        await mission.addPathPoint(latitude, longitude, altitude, heading, speed, batteryPercent);

        // Emit to mission room
        io.to(`mission:${missionId}`).emit('mission:path:updated', {
          missionId,
          latitude,
          longitude,
          altitude,
          heading,
          speed,
          batteryPercent,
          timestamp: new Date()
        });

        // Emit to order room (if order is associated)
        if (mission.orderId) {
          io.to(`order:${mission.orderId}`).emit('order:drone:location', {
            orderId: mission.orderId,
            missionId,
            latitude,
            longitude,
            altitude,
            heading,
            speed,
            batteryPercent,
            timestamp: new Date()
          });
        }

        logger.debug(`Mission path updated: ${missionId} - ${latitude}, ${longitude}`);
      } catch (error) {
        logger.error('Mission path update error:', error);
        socket.emit('error', { message: 'Failed to update mission path' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.email} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.email}:`, error);
    });
  });

  // Emit order updates to relevant rooms
  const emitOrderUpdate = (order, event = 'order:updated') => {
    io.to(`order:${order._id}`).emit(event, order);
    io.to(`user:${order.userId}`).emit(event, order);
    io.to(`restaurant:${order.restaurantId}`).emit(event, order);
  };

  // Emit mission updates to relevant rooms
  const emitMissionUpdate = (mission, event = 'mission:updated') => {
    io.to(`mission:${mission._id}`).emit(event, mission);
    if (mission.orderId) {
      io.to(`order:${mission.orderId}`).emit(event, mission);
    }
    io.to(`restaurant:${mission.restaurantId}`).emit(event, mission);
  };

  // Export emit functions for use in other modules
  io.emitOrderUpdate = emitOrderUpdate;
  io.emitMissionUpdate = emitMissionUpdate;

  logger.info('Socket.IO handler initialized');
};

module.exports = socketHandler;

