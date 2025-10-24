import api from './api'

export const paymentInfoService = {
  // Get all payment info for current user
  async getPaymentInfo() {
    const response = await api.get('/user/payment-info')
    return response.data
  },

  // Create new payment info
  async createPaymentInfo(paymentData) {
    const response = await api.post('/user/payment-info', paymentData)
    return response.data
  },

  // Update payment info
  async updatePaymentInfo(id, paymentData) {
    const response = await api.put(`/user/payment-info/${id}`, paymentData)
    return response.data
  },

  // Delete payment info
  async deletePaymentInfo(id) {
    const response = await api.delete(`/user/payment-info/${id}`)
    return response.data
  },

  // Set default payment info
  async setDefaultPaymentInfo(id) {
    const response = await api.put(`/user/payment-info/${id}/default`)
    return response.data
  }
}
