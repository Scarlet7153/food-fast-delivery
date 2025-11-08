const Payment = require('../models/Payment');
const momoService = require('../services/momo.service');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../config/env');

// Create payment request
const createPayment = async (req, res) => {
  try {
    const { orderId, method = 'MOMO' } = req.body;
    
    // Get order details
    let order;
    try {
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/internal/orders/${orderId}`);
      order = orderResponse.data.data.order;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to pay for this order'
      });
    }
    
    // Check if order is in correct status
    if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Order is not in a payable state'
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this order',
        data: {
          payment: existingPayment
        }
      });
    }
    
    // Create payment record
    const paymentData = {
      orderId,
      userId: req.user._id,
      restaurantId: order.restaurantId,
      method,
      amount: {
        total: order.amount.total,
        currency: order.amount.currency,
        breakdown: {
          subtotal: order.amount.subtotal,
          deliveryFee: order.amount.deliveryFee,
          tax: order.amount.tax,
          discount: order.amount.discount
        }
      },
      metadata: {
        customerInfo: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone
        },
        orderInfo: {
          orderNumber: order.orderNumber,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        },
        deliveryInfo: {
          address: order.deliveryAddress.text,
          contactPhone: order.deliveryAddress.contactPhone
        }
      },
      security: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    };
    
    const payment = new Payment(paymentData);
    await payment.save();
    
    // Process payment based on method
    let paymentResult;
    
    if (method === 'MOMO') {
      paymentResult = await momoService.createPaymentRequest({
        orderId: payment._id.toString(),
        amount: payment.amount.total,
        orderInfo: `Payment for order ${order.orderNumber}`,
        extraData: JSON.stringify({
          paymentId: payment._id,
          orderId: order._id
        }),
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone
      });
      
      if (paymentResult.success) {
        // Update payment with MoMo data
        payment.momo = paymentResult.data;
        payment.status = 'PROCESSING';
        await payment.save();
      } else {
        payment.status = 'FAILED';
        await payment.save();
        
        return res.status(400).json({
          success: false,
          error: paymentResult.error
        });
      }
    } else if (method === 'COD') {
      payment.status = 'COMPLETED';
      payment.completedAt = new Date();
      await payment.save();
      
      paymentResult = {
        success: true,
        data: {
          message: 'Cash on delivery payment confirmed'
        }
      };
    }
    
    logger.info(`Payment created: ${payment.paymentNumber} for order ${order.orderNumber}`);
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment,
        paymentUrl: paymentResult.data.payUrl,
        qrCodeUrl: paymentResult.data.qrCodeUrl
      }
    });
    
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if user has permission to view this payment
    if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'restaurant') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this payment'
      });
    }
    
    res.json({
      success: true,
      data: {
        payment
      }
    });
    
  } catch (error) {
    logger.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment'
    });
  }
};

// Get user payments
const getUserPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 10 } = req.query;
    
    const options = {};
    if (status) options.status = status;
    if (method) options.method = method;
    
    const payments = await Payment.findByUser(req.user._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments({ userId: req.user._id, ...options });
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payments'
    });
  }
};

// Get restaurant payments
const getRestaurantPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 10 } = req.query;
    
    // Get restaurant ID for the user
    let restaurantId;
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      restaurantId = restaurantResponse.data.data.restaurant._id;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const options = {};
    if (status) options.status = status;
    if (method) options.method = method;
    
    const payments = await Payment.findByRestaurant(restaurantId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments({ restaurantId, ...options });
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get restaurant payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payments'
    });
  }
};

// Process payment callback (MoMo IPN)
const processPaymentCallback = async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Verify payment result
    const verificationResult = await momoService.verifyPaymentResult(paymentData);
    
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error
      });
    }
    
    const { orderId, transId, amount, isSuccess, resultCode } = verificationResult.data;
    
    // Find payment by order ID
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Update payment status
    if (isSuccess) {
      await payment.updateStatus('COMPLETED', 'Payment completed via MoMo', {
        transId,
        resultCode,
        gatewayResponse: paymentData
      });
      
      // Update order status
      try {
        await axios.patch(`${config.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/status`, {
          status: 'CONFIRMED',
          note: 'Payment completed successfully'
        });
      } catch (error) {
        logger.warn('Failed to update order status:', error);
      }
    } else {
      await payment.updateStatus('FAILED', 'Payment failed via MoMo', {
        transId,
        resultCode,
        gatewayResponse: paymentData
      });
    }
    
    logger.info(`Payment callback processed: ${payment.paymentNumber} - ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    res.json({
      success: true,
      message: 'Payment callback processed successfully'
    });
    
  } catch (error) {
    logger.error('Process payment callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment callback'
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if user has permission to refund
    if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to refund this payment'
      });
    }
    
    // Check if payment is refundable
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded'
      });
    }
    
    const refundAmount = amount || payment.amount.total;
    
    // Process refund based on payment method
    if (payment.method === 'MOMO' && payment.momo.transId) {
      const refundResult = await momoService.createRefundRequest({
        orderId: payment.orderId.toString(),
        transId: payment.momo.transId,
        amount: refundAmount,
        description: reason || 'Order cancellation refund'
      });
      
      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          error: refundResult.error
        });
      }
      
      // Update payment with refund info
      payment.refund.refundId = refundResult.data.refundId;
      payment.refund.refundStatus = 'PROCESSING';
    }
    
    // Process refund
    await payment.processRefund(refundAmount, reason);
    
    logger.info(`Refund processed: ${payment.paymentNumber} for amount ${refundAmount}`);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment
      }
    });
    
  } catch (error) {
    logger.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process refund'
    });
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Get restaurant ID for the user
    let restaurantId;
    try {
      const restaurantResponse = await axios.get(`${config.RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.user._id}`);
      restaurantId = restaurantResponse.data.data.restaurant._id;
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    const stats = await Payment.getStatistics(restaurantId, dateFrom, dateTo);
    
    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalPayments: 0,
          completedPayments: 0,
          failedPayments: 0,
          totalRevenue: 0,
          averagePaymentValue: 0,
          successRate: 0
        }
      }
    });
    
  } catch (error) {
    logger.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment statistics'
    });
  }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if user has permission to view this payment
    if (payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this payment'
      });
    }
    
    // If payment is still processing and using MoMo, check status
    if (payment.status === 'PROCESSING' && payment.method === 'MOMO' && payment.momo.requestId) {
      const statusResult = await momoService.checkPaymentStatus(payment.orderId.toString(), payment.momo.requestId);
      
      if (statusResult.success && statusResult.data.status === 'COMPLETED') {
        await payment.updateStatus('COMPLETED', 'Payment verified via status check');
      }
    }
    
    res.json({
      success: true,
      data: {
        payment
      }
    });
    
  } catch (error) {
    logger.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
};

// Create MoMo payment request (simplified version)
const createMoMoPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Fetch order details
    let order;
    try {
      const orderResponse = await axios.get(`${config.ORDER_SERVICE_URL}/api/internal/orders/${orderId}`);
      order = orderResponse.data.data.order;
    } catch (err) {
      logger.error('Failed to fetch order:', err.message || err);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const amount = order.amount.total;
    const momoOrderInfo = `Order ${order.orderNumber}`;
    const momoExtraData = JSON.stringify({ orderNumber: order.orderNumber, restaurantId: order.restaurantId });

    // Find existing payment for this order (to avoid unique index violation)
    let payment = await Payment.findOne({ orderId });

    if (payment) {
      logger.info(`Existing payment found for order ${order.orderNumber}: ${payment._id}`);

      // If there's already an in-flight MoMo payment, return its URL so client can continue
      if (payment.method === 'MOMO' && ['PENDING', 'PROCESSING'].includes(payment.status)) {
        return res.json({
          success: true,
          data: {
            paymentId: payment._id,
            payUrl: payment.momo?.payUrl || null,
            requestId: payment.momo?.requestId || null
          }
        });
      }

      // Otherwise, reuse/update existing payment record to switch to MoMo
      payment.method = 'MOMO';
      payment.status = 'PENDING';
      payment.paymentNumber = payment.paymentNumber || `PAY${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`;
      payment.amount = {
        total: amount,
        currency: 'VND',
        breakdown: {
          subtotal: order.amount.subtotal,
          deliveryFee: order.amount.deliveryFee,
          tax: order.amount.tax || 0,
          discount: order.amount.discount || 0
        }
      };
      payment.metadata = payment.metadata || {};
      payment.metadata.customerInfo = payment.metadata.customerInfo || {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      };
      payment.metadata.orderInfo = payment.metadata.orderInfo || {
        orderNumber: order.orderNumber,
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
      };
      payment.metadata.deliveryInfo = payment.metadata.deliveryInfo || {
        address: order.deliveryAddress.text,
        contactPhone: order.deliveryAddress.contactPhone
      };

      // Clear previous MoMo fields if any
      payment.momo = {};
      await payment.save();
    } else {
      // Create new payment
      payment = new Payment({
        orderId,
        userId: req.user._id,
        restaurantId: order.restaurantId,
        paymentNumber: `PAY${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
        method: 'MOMO',
        status: 'PENDING',
        amount: {
          total: amount,
          currency: 'VND',
          breakdown: {
            subtotal: order.amount.subtotal,
            deliveryFee: order.amount.deliveryFee,
            tax: order.amount.tax || 0,
            discount: order.amount.discount || 0
          }
        },
        security: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          riskScore: 0
        },
        metadata: {
          customerInfo: { name: req.user.name, email: req.user.email, phone: req.user.phone },
          orderInfo: { orderNumber: order.orderNumber, items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })) },
          deliveryInfo: { address: order.deliveryAddress.text, contactPhone: order.deliveryAddress.contactPhone }
        }
      });

      await payment.save();
    }

    // Create MoMo payment request
    const paymentResult = await momoService.createPaymentRequest({
      orderId: payment._id.toString(),
      amount,
      orderInfo: momoOrderInfo,
      extraData: momoExtraData,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    });

    if (paymentResult.success) {
      payment.momo = payment.momo || {};
      payment.momo.requestId = paymentResult.data.requestId;
      payment.momo.payUrl = paymentResult.data.payUrl;
      payment.status = 'PROCESSING';
      await payment.save();

      return res.json({ success: true, data: { paymentId: payment._id, payUrl: payment.momo.payUrl, requestId: payment.momo.requestId } });
    }

    // Failed to create MoMo request
    payment.status = 'FAILED';
    await payment.save();
    return res.status(400).json({ success: false, error: paymentResult.error || 'Failed to create MoMo payment' });
  } catch (error) {
    logger.error('Create MoMo payment error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Verify MoMo payment callback and update order status
const verifyMoMoPayment = async (req, res) => {
  try {
    const {
      orderId: momoOrderId,  // This is payment ID from MoMo
      resultCode,
      transId,
      signature,
      ...otherData
    } = req.body;

    // Find payment by MoMo order ID (which is payment._id)
    const payment = await Payment.findById(momoOrderId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Verify signature
    const isValid = momoService.verifySignature(
      `accessKey=${config.MOMO_ACCESS_KEY}&amount=${otherData.amount}&extraData=${otherData.extraData || ''}&message=${otherData.message}&orderId=${momoOrderId}&orderInfo=${otherData.orderInfo}&orderType=${otherData.orderType}&partnerCode=${otherData.partnerCode}&payType=${otherData.payType}&requestId=${otherData.requestId}&responseTime=${otherData.responseTime}&resultCode=${resultCode}&transId=${transId}`,
      signature
    );

    if (!isValid) {
      logger.warn('Invalid MoMo signature for payment:', momoOrderId);
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Update payment status
    if (resultCode === '0') {
      payment.status = 'COMPLETED';
      payment.momo.transId = transId;
      payment.momo.resultCode = parseInt(resultCode);
      payment.momo.responseTime = otherData.responseTime;
      await payment.save();

      // Update order status from PENDING_PAYMENT to PLACED
      try {
        await axios.patch(
          `${config.ORDER_SERVICE_URL}/api/internal/orders/${payment.orderId}/status`,
          {
            status: 'PLACED',
            paymentStatus: 'PAID'
          }
        );
      } catch (error) {
        logger.error('Failed to update order status:', error);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: payment.orderId,  // Return real order ID
          paymentId: payment._id,
          transId
        }
      });
    } else {
      payment.status = 'FAILED';
      payment.momo.resultCode = parseInt(resultCode);
      payment.momo.responseTime = otherData.responseTime;
      await payment.save();

      res.status(400).json({
        success: false,
        error: 'Payment failed',
        resultCode
      });
    }
  } catch (error) {
    logger.error('Verify MoMo payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createPayment,
  createMoMoPayment,
  verifyMoMoPayment,
  getPaymentById,
  getUserPayments,
  getRestaurantPayments,
  processPaymentCallback,
  processRefund,
  getPaymentStatistics,
  checkPaymentStatus
};
