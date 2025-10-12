const Order = require('../models/Order');
const moMoService = require('../services/payment.momo');
const logger = require('../utils/logger');

// Create MoMo payment
const createMoMoPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    // Validate order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order is already paid
    if (order.payment.status === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }

    // Check if payment is already pending
    if (order.payment.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Payment is already pending'
      });
    }

    // Validate amount matches order total
    if (parseInt(amount) !== order.amount.total) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount does not match order total'
      });
    }

    // Create MoMo payment request
    const paymentData = {
      orderId: orderId,
      amount: order.amount.total,
      orderInfo: orderInfo || `Thanh toan don hang ${order.orderNumber}`,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    };

    const paymentResult = await moMoService.createPaymentRequest(paymentData);

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: paymentResult.error
      });
    }

    // Update order payment info
    order.payment.status = 'PENDING';
    order.payment.momo = {
      requestId: paymentResult.data.requestId,
      orderId: paymentResult.data.orderId,
      transId: paymentResult.data.transId,
      payUrl: paymentResult.data.payUrl,
      qrCodeUrl: paymentResult.data.qrCodeUrl
    };

    await order.save();

    logger.info(`MoMo payment created for order: ${order.orderNumber}`);

    res.json({
      success: true,
      message: 'Payment request created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount.total,
        currency: order.amount.currency,
        payment: {
          method: 'MOMO',
          status: 'PENDING',
          payUrl: paymentResult.data.payUrl,
          qrCodeUrl: paymentResult.data.qrCodeUrl,
          deeplink: paymentResult.data.deeplink,
          applink: paymentResult.data.applink,
          requestId: paymentResult.data.requestId,
          transId: paymentResult.data.transId
        }
      }
    });

  } catch (error) {
    logger.error('Create MoMo payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment request'
    });
  }
};

// Handle MoMo IPN (Instant Payment Notification)
const handleMoMoIPN = async (req, res) => {
  try {
    const paymentData = req.body;

    logger.info('Received MoMo IPN:', paymentData);

    // Verify payment result
    const verificationResult = await moMoService.verifyPaymentResult(paymentData);

    if (!verificationResult.success) {
      logger.error('MoMo IPN verification failed:', verificationResult.error);
      return res.status(400).json({
        success: false,
        error: verificationResult.error
      });
    }

    const { orderId, transId, amount, isSuccess, resultCode } = verificationResult.data;

    // Find order
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      logger.error(`Order not found for MoMo IPN: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update order payment status
    if (isSuccess) {
      order.payment.status = 'PAID';
      order.payment.paidAt = new Date();
      order.payment.momo.transId = transId;

      // Update order status to confirmed if it's still placed
      if (order.status === 'PLACED') {
        await order.updateStatus('CONFIRMED', null, 'Payment confirmed');
      }

      logger.info(`Order ${order.orderNumber} payment confirmed via MoMo IPN`);
    } else {
      order.payment.status = 'FAILED';
      logger.warn(`Order ${order.orderNumber} payment failed via MoMo IPN`);
    }

    await order.save();

    // Emit realtime update via Socket.IO
    if (req.app && req.app.get('io')) {
      req.app.get('io').emitOrderUpdate(order, 'payment:updated');
    }

    // Return success response to MoMo
    res.json({
      success: true,
      message: 'IPN processed successfully'
    });

  } catch (error) {
    logger.error('MoMo IPN handling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process IPN'
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (req.user.role === 'restaurant' && order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check payment status with MoMo if pending
    let paymentStatus = order.payment.status;
    if (order.payment.status === 'PENDING' && order.payment.momo?.requestId) {
      const statusResult = await moMoService.checkPaymentStatus(orderId, order.payment.momo.requestId);
      if (statusResult.success) {
        // Update order if payment status changed
        // This is a simplified check - in production you'd want more robust status checking
        if (statusResult.data.status === 'SUCCESS' && order.payment.status !== 'PAID') {
          order.payment.status = 'PAID';
          order.payment.paidAt = new Date();
          await order.save();
          paymentStatus = 'PAID';
        }
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        payment: {
          method: order.payment.method,
          status: paymentStatus,
          amount: order.amount.total,
          currency: order.amount.currency,
          paidAt: order.payment.paidAt,
          momo: order.payment.momo ? {
            requestId: order.payment.momo.requestId,
            transId: order.payment.momo.transId,
            payUrl: order.payment.momo.payUrl,
            qrCodeUrl: order.payment.momo.qrCodeUrl
          } : null
        }
      }
    });

  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
};

// Create refund
const createRefund = async (req, res) => {
  try {
    const { orderId, reason, amount } = req.body;

    // Find order
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order is paid
    if (order.payment.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Order is not paid'
      });
    }

    // Check if already refunded
    if (order.payment.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        error: 'Order is already refunded'
      });
    }

    const refundAmount = amount || order.amount.total;

    // Create MoMo refund request
    const refundData = {
      orderId: orderId,
      transId: order.payment.momo?.transId,
      amount: refundAmount,
      description: reason || 'Order refund'
    };

    const refundResult = await moMoService.createRefundRequest(refundData);

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        error: refundResult.error
      });
    }

    // Update order payment status
    order.payment.status = 'REFUNDED';
    order.payment.refundedAt = new Date();

    await order.save();

    logger.info(`Refund created for order: ${order.orderNumber}`);

    res.json({
      success: true,
      message: 'Refund created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundAmount,
        refundId: refundResult.data.refundId,
        status: refundResult.data.status
      }
    });

  } catch (error) {
    logger.error('Create refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create refund'
    });
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'MOMO',
        name: 'MoMo Wallet',
        description: 'Thanh toán qua ví điện tử MoMo',
        logo: '/images/payment/momo-logo.png',
        available: true,
        features: ['QR Code', 'App-to-App', 'Instant Payment']
      }
      // Add more payment methods here in the future
    ];

    res.json({
      success: true,
      data: {
        paymentMethods
      }
    });

  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query;

    const query = { userId: req.user._id };
    
    if (status) {
      query['payment.status'] = status;
    }
    
    if (method) {
      query['payment.method'] = method;
    }

    const orders = await Order.find(query)
      .select('orderNumber amount payment status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments: orders.map(order => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.amount.total,
          currency: order.amount.currency,
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt,
          createdAt: order.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history'
    });
  }
};

module.exports = {
  createMoMoPayment,
  handleMoMoIPN,
  getPaymentStatus,
  createRefund,
  getPaymentMethods,
  getPaymentHistory
};

