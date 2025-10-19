const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service configuration error:', error);
        } else {
          logger.info('Email service is ready to send messages');
        }
      });
    } else {
      logger.warn('Email service not configured - SMTP credentials missing');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      const mailOptions = {
        from: `"Fast Food Delivery Drone" <${config.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendOrderNotification(userEmail, userName, orderData) {
    const { orderNumber, status, items, total, estimatedDeliveryTime } = orderData;
    
    const subject = `Order ${orderNumber} - ${this.getStatusMessage(status)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .item { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { font-weight: bold; font-size: 18px; color: #e74c3c; }
          .status { padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
          .status.confirmed { background-color: #d4edda; color: #155724; }
          .status.cooking { background-color: #fff3cd; color: #856404; }
          .status.delivered { background-color: #d1ecf1; color: #0c5460; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍕 Fast Food Delivery Drone</h1>
            <h2>Order Update</h2>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>Your order <strong>${orderNumber}</strong> status has been updated:</p>
            
            <div class="status ${status.toLowerCase()}">
              ${this.getStatusMessage(status)}
            </div>
            
            <div class="order-details">
              <h3>Order Details:</h3>
              ${items.map(item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>${item.totalPrice.toLocaleString()} VND</span>
                </div>
              `).join('')}
              
              <hr>
              <div class="item total">
                <span>Total:</span>
                <span>${total.toLocaleString()} VND</span>
              </div>
            </div>
            
            ${estimatedDeliveryTime ? `
              <p><strong>Estimated delivery time:</strong> ${new Date(estimatedDeliveryTime).toLocaleString()}</p>
            ` : ''}
            
            <p>Thank you for choosing Fast Food Delivery Drone!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Fast Food Delivery Drone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  async sendPaymentNotification(userEmail, userName, paymentData) {
    const { orderNumber, amount, status, paymentMethod } = paymentData;
    
    const subject = `Payment ${status} - Order ${orderNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .payment-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .status { padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
          .status.success { background-color: #d4edda; color: #155724; }
          .status.failed { background-color: #f8d7da; color: #721c24; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Fast Food Delivery Drone</h1>
            <h2>Payment Notification</h2>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>Your payment for order <strong>${orderNumber}</strong> has been processed:</p>
            
            <div class="status ${status.toLowerCase()}">
              Payment ${status.toUpperCase()}
            </div>
            
            <div class="payment-details">
              <h3>Payment Details:</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Amount:</strong> ${amount.toLocaleString()} VND</p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            </div>
            
            ${status === 'success' ? 
              '<p>Your order is now being prepared. You will receive updates on the delivery progress.</p>' :
              '<p>Please try again or contact support if the problem persists.</p>'
            }
            
            <p>Thank you for choosing Fast Food Delivery Drone!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Fast Food Delivery Drone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  async sendPromotionEmail(userEmail, userName, promotionData) {
    const { title, description, discount, validUntil, code } = promotionData;
    
    const subject = `🎉 Special Offer: ${title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Special Offer</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .promo-code { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px dashed #e74c3c; }
          .code { font-size: 24px; font-weight: bold; color: #e74c3c; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Special Offer!</h1>
            <h2>${title}</h2>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>${description}</p>
            
            <div class="promo-code">
              <h3>Use this code:</h3>
              <div class="code">${code}</div>
              <p>Get ${discount}% off your next order!</p>
            </div>
            
            <p><strong>Valid until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>
            
            <p>Don't miss out on this amazing offer! Order now and enjoy delicious food delivered by drone.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Fast Food Delivery Drone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  getStatusMessage(status) {
    const statusMessages = {
      'PLACED': 'Order Placed',
      'CONFIRMED': 'Order Confirmed',
      'COOKING': 'Food is Being Prepared',
      'READY_FOR_PICKUP': 'Ready for Pickup',
      'IN_FLIGHT': 'Drone is Delivering',
      'DELIVERED': 'Order Delivered',
      'CANCELLED': 'Order Cancelled',
      'FAILED': 'Order Failed'
    };
    
    return statusMessages[status] || status;
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

module.exports = new EmailService();
