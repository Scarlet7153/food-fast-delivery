const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

class MoMoPaymentService {
  constructor() {
    this.partnerCode = config.MOMO_PARTNER_CODE;
    this.accessKey = config.MOMO_ACCESS_KEY;
    this.secretKey = config.MOMO_SECRET_KEY;
    this.endpoint = config.MOMO_ENDPOINT_CREATE;
    this.ipnUrl = config.MOMO_IPN_URL;
    this.returnUrl = config.MOMO_RETURN_URL;
  }

  // Generate MoMo signature
  generateSignature(rawSignature) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  // Verify MoMo signature
  verifySignature(rawSignature, signature) {
    const expectedSignature = this.generateSignature(rawSignature);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Create payment request
  async createPaymentRequest(orderData) {
    try {
      const {
        orderId,
        amount,
        orderInfo,
        extraData = '',
        requestId = `REQ${Date.now()}`,
        partnerCode = this.partnerCode,
        redirectUrl = this.returnUrl,
        ipnUrl = this.ipnUrl
      } = orderData;

      // Validate required fields
      if (!this.partnerCode || !this.accessKey || !this.secretKey) {
        throw new Error('MoMo configuration is incomplete. Please check environment variables.');
      }

      const orderIdStr = orderId.toString();
      const amountStr = amount.toString();
      const requestIdStr = requestId.toString();

      // Create raw signature
      const rawSignature = `accessKey=${this.accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderIdStr}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestIdStr}&requestType=captureWallet`;

      // Generate signature
      const signature = this.generateSignature(rawSignature);

      // Create request body
      const requestBody = {
        partnerCode,
        partnerName: 'Fast Food Delivery Drone',
        storeId: 'FFDD',
        requestType: 'captureWallet',
        ipnUrl,
        redirectUrl,
        orderId: orderIdStr,
        amount: parseInt(amountStr),
        lang: 'vi',
        orderInfo,
        extraData,
        requestId: requestIdStr,
        items: [],
        userInfo: {
          name: orderData.customerName || 'Customer',
          email: orderData.customerEmail || 'customer@example.com',
          phoneNumber: orderData.customerPhone || '0123456789'
        },
        signature
      };

      logger.info(`Creating MoMo payment request for order: ${orderId}`);

      // Make API request
      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.resultCode === 0) {
        logger.info(`MoMo payment request created successfully for order: ${orderId}`);
        return {
          success: true,
          data: {
            payUrl: response.data.payUrl,
            deeplink: response.data.deeplink,
            qrCodeUrl: response.data.qrCodeUrl,
            applink: response.data.applink,
            requestId: response.data.requestId,
            orderId: response.data.orderId,
            transId: response.data.transId
          }
        };
      } else {
        logger.error(`MoMo payment request failed for order: ${orderId}`, response.data);
        return {
          success: false,
          error: response.data.message || 'Payment request failed'
        };
      }

    } catch (error) {
      logger.error('MoMo payment request error:', error);
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'Payment service error'
        };
      }
      
      return {
        success: false,
        error: 'Network error or service unavailable'
      };
    }
  }

  // Verify payment result
  async verifyPaymentResult(paymentData) {
    try {
      const {
        orderId,
        resultCode,
        transId,
        amount,
        orderInfo,
        responseTime,
        extraData,
        signature
      } = paymentData;

      // Create raw signature for verification
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${resultCode === 0 ? 'Success' : 'Failed'}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=momo_wallet&partnerCode=${this.partnerCode}&payType=web&requestId=${Date.now()}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      // Verify signature
      const isValidSignature = this.verifySignature(rawSignature, signature);
      
      if (!isValidSignature) {
        logger.error(`Invalid MoMo signature for order: ${orderId}`);
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Check result code
      const isSuccess = resultCode === 0;
      
      logger.info(`MoMo payment verification for order ${orderId}: ${isSuccess ? 'SUCCESS' : 'FAILED'} (${resultCode})`);

      return {
        success: true,
        data: {
          orderId,
          transId,
          amount,
          resultCode,
          isSuccess,
          message: isSuccess ? 'Payment successful' : 'Payment failed',
          responseTime,
          extraData
        }
      };

    } catch (error) {
      logger.error('MoMo payment verification error:', error);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  // Create refund request
  async createRefundRequest(refundData) {
    try {
      const {
        orderId,
        transId,
        amount,
        description = 'Order cancellation refund'
      } = refundData;

      const requestId = `REF${Date.now()}`;
      
      // Create raw signature for refund
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&transId=${transId}`;
      
      const signature = this.generateSignature(rawSignature);

      const requestBody = {
        partnerCode: this.partnerCode,
        orderId,
        requestId,
        amount: parseInt(amount),
        transId,
        lang: 'vi',
        description,
        signature
      };

      logger.info(`Creating MoMo refund request for order: ${orderId}`);

      // Note: MoMo refund endpoint would be different in production
      // This is a placeholder for the refund implementation
      const refundEndpoint = this.endpoint.replace('/create', '/refund');
      
      const response = await axios.post(refundEndpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.resultCode === 0) {
        logger.info(`MoMo refund request created successfully for order: ${orderId}`);
        return {
          success: true,
          data: {
            refundId: response.data.refundId,
            transId: response.data.transId,
            amount: response.data.amount,
            status: response.data.status
          }
        };
      } else {
        logger.error(`MoMo refund request failed for order: ${orderId}`, response.data);
        return {
          success: false,
          error: response.data.message || 'Refund request failed'
        };
      }

    } catch (error) {
      logger.error('MoMo refund request error:', error);
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'Refund service error'
        };
      }
      
      return {
        success: false,
        error: 'Network error or service unavailable'
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId, requestId) {
    try {
      // Note: This would require MoMo's query API endpoint
      // For now, we'll return a mock response
      logger.info(`Checking MoMo payment status for order: ${orderId}`);
      
      // In a real implementation, you would call MoMo's query API
      return {
        success: true,
        data: {
          orderId,
          status: 'PENDING',
          message: 'Payment status check not implemented in sandbox mode'
        }
      };

    } catch (error) {
      logger.error('MoMo payment status check error:', error);
      return {
        success: false,
        error: 'Payment status check failed'
      };
    }
  }

  // Generate QR code data (for manual QR generation)
  generateQRCodeData(orderData) {
    const {
      orderId,
      amount,
      orderInfo,
      extraData = ''
    } = orderData;

    const qrData = {
      partnerCode: this.partnerCode,
      orderId: orderId.toString(),
      amount: amount.toString(),
      orderInfo,
      extraData,
      merchantName: 'Fast Food Delivery Drone',
      merchantCode: 'FFDD'
    };

    return `momo://transfer?${new URLSearchParams(qrData).toString()}`;
  }
}

module.exports = new MoMoPaymentService();

