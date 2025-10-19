const admin = require('firebase-admin');
const config = require('../config/env');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  initializeFirebase() {
    if (config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY && config.FIREBASE_CLIENT_EMAIL) {
      try {
        const serviceAccount = {
          projectId: config.FIREBASE_PROJECT_ID,
          privateKey: config.FIREBASE_PRIVATE_KEY,
          clientEmail: config.FIREBASE_CLIENT_EMAIL
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: config.FIREBASE_PROJECT_ID
        });

        this.initialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
      } catch (error) {
        logger.error('Firebase initialization failed:', error);
      }
    } else {
      logger.warn('Firebase not configured - push notifications disabled');
    }
  }

  async sendPushNotification(deviceToken, notification) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#e74c3c',
            sound: 'default',
            channelId: 'ffdd_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent successfully: ${response}`);
      
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      logger.error('Push notification failed:', error);
      throw error;
    }
  }

  async sendOrderStatusNotification(deviceToken, orderData) {
    const { orderNumber, status, estimatedDeliveryTime } = orderData;
    
    const notification = {
      title: `Order ${orderNumber}`,
      message: this.getOrderStatusMessage(status),
      type: 'ORDER_STATUS_UPDATE',
      data: {
        orderNumber,
        status,
        estimatedDeliveryTime: estimatedDeliveryTime?.toISOString()
      }
    };

    return await this.sendPushNotification(deviceToken, notification);
  }

  async sendPaymentNotification(deviceToken, paymentData) {
    const { orderNumber, amount, status } = paymentData;
    
    const notification = {
      title: 'Payment Update',
      message: `Payment for order ${orderNumber} is ${status}`,
      type: 'PAYMENT_SUCCESS',
      data: {
        orderNumber,
        amount: amount.toString(),
        status
      }
    };

    return await this.sendPushNotification(deviceToken, notification);
  }

  async sendDroneNotification(deviceToken, droneData) {
    const { orderNumber, status, estimatedArrival } = droneData;
    
    const notification = {
      title: 'Drone Update',
      message: this.getDroneStatusMessage(status, orderNumber),
      type: 'DRONE_DISPATCHED',
      data: {
        orderNumber,
        status,
        estimatedArrival: estimatedArrival?.toISOString()
      }
    };

    return await this.sendPushNotification(deviceToken, notification);
  }

  async sendPromotionNotification(deviceToken, promotionData) {
    const { title, description, discount, code } = promotionData;
    
    const notification = {
      title: '🎉 Special Offer!',
      message: `${title} - Get ${discount}% off with code ${code}`,
      type: 'PROMOTION',
      data: {
        title,
        description,
        discount: discount.toString(),
        code
      }
    };

    return await this.sendPushNotification(deviceToken, notification);
  }

  async sendToMultipleDevices(deviceTokens, notification) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const message = {
        tokens: deviceTokens,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#e74c3c',
            sound: 'default',
            channelId: 'ffdd_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      logger.info(`Multicast push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Multicast push notification failed:', error);
      throw error;
    }
  }

  async sendToTopic(topic, notification) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#e74c3c',
            sound: 'default',
            channelId: 'ffdd_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`Topic push notification sent to ${topic}: ${response}`);
      
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      logger.error('Topic push notification failed:', error);
      throw error;
    }
  }

  getOrderStatusMessage(status) {
    const statusMessages = {
      'PLACED': 'Your order has been placed and is being confirmed',
      'CONFIRMED': 'Your order has been confirmed and is being prepared',
      'COOKING': 'Your food is being prepared with love',
      'READY_FOR_PICKUP': 'Your order is ready! Drone is preparing for takeoff',
      'IN_FLIGHT': 'Your drone is on the way! 🚁',
      'DELIVERED': 'Your order has been delivered! Enjoy your meal! 🍕',
      'CANCELLED': 'Your order has been cancelled',
      'FAILED': 'There was an issue with your order'
    };
    
    return statusMessages[status] || 'Your order status has been updated';
  }

  getDroneStatusMessage(status, orderNumber) {
    const statusMessages = {
      'DISPATCHED': `Drone dispatched for order ${orderNumber}`,
      'IN_FLIGHT': `Drone is flying to your location for order ${orderNumber}`,
      'ARRIVED': `Drone has arrived! Please collect your order ${orderNumber}`,
      'DELIVERED': `Order ${orderNumber} delivered successfully!`,
      'RETURNING': `Drone is returning to base after delivering order ${orderNumber}`
    };
    
    return statusMessages[status] || `Drone update for order ${orderNumber}`;
  }

  async validateToken(deviceToken) {
    if (!this.initialized) {
      return false;
    }

    try {
      // Try to send a test message to validate the token
      await admin.messaging().send({
        token: deviceToken,
        data: { test: 'true' }
      }, true); // dry run
      
      return true;
    } catch (error) {
      logger.warn(`Invalid device token: ${deviceToken}`, error.message);
      return false;
    }
  }
}

module.exports = new PushNotificationService();
