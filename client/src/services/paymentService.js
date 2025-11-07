import api from './api'

export const paymentService = {
  // Create MoMo payment
  async createMoMoPayment(paymentData) {
    const response = await api.post('/payments/momo/create', paymentData)
    return response.data
  },

  // Verify MoMo payment callback
  async verifyMoMoPayment(callbackData) {
    const response = await api.post('/payments/momo/verify', callbackData)
    return response.data
  },

  // Get payment status
  async getPaymentStatus(orderId) {
    const response = await api.get(`/payments/momo/${orderId}/status`)
    return response.data
  },

  // Get payment methods
  async getPaymentMethods() {
    const response = await api.get('/payments/methods')
    return response.data
  },

  // Get payment history
  async getPaymentHistory(params = {}) {
    const response = await api.get('/payments/history', { params })
    return response.data
  },

  // Create refund (admin)
  async createRefund(refundData) {
    const response = await api.post('/payments/momo/refund', refundData)
    return response.data
  }
}
