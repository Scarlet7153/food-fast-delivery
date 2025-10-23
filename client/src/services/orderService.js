import api from './api'

export const orderService = {
  // Create new order
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // Get my orders (customer)
  async getMyOrders(params = {}) {
    const response = await api.get('/orders/user', { params })
    return response.data
  },

  // Get single order
  async getOrder(id) {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Cancel order (customer)
  async cancelOrder(id, reason) {
    const response = await api.patch(`/orders/${id}/cancel`, { reason })
    return response.data
  },

  // Rate order (customer)
  async rateOrder(id, rating) {
    const response = await api.post(`/orders/${id}/rate`, rating)
    return response.data
  },

  // Get restaurant orders (restaurant owner)
  async getRestaurantOrders(params = {}) {
    const response = await api.get('/orders/restaurant/orders', { params })
    return response.data
  },

  // Update order status (restaurant owner)
  async updateOrderStatus(id, status, note) {
    const response = await api.patch(`/orders/${id}/status`, { status, note })
    return response.data
  },

  // Get restaurant order statistics
  async getRestaurantOrderStats(params = {}) {
    const response = await api.get('/orders/restaurant/stats', { params })
    return response.data
  },

  // Admin: Get all orders
  async getAllOrders(params = {}) {
    const response = await api.get('/admin/orders/all', { params })
    return response.data
  }
}
