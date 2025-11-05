import api from './api'

export const adminService = {
  // Dashboard stats
  async getDashboardStats(params = {}) {
    const response = await api.get('/admin/dashboard', { params })
    return response.data
  },

  // User management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  async updateUserStatus(userId, action, reason) {
    const response = await api.patch(`/admin/users/${userId}/status`, { action, reason })
    return response.data
  },

  // Restaurant management
  async getRestaurants(params = {}) {
    const response = await api.get('/admin/restaurants', { params })
    return response.data
  },

  async getRestaurantById(restaurantId) {
    const response = await api.get(`/admin/restaurants/${restaurantId}`)
    return response.data
  },

  async updateRestaurantStatus(restaurantId, action, reason) {
    const response = await api.patch(`/admin/restaurants/${restaurantId}/status`, { action, reason })
    return response.data
  },

  // Order management
  async getAllOrders(params = {}) {
    const response = await api.get('/admin/orders', { params })
    return response.data
  },

  async getOrderById(orderId) {
    const response = await api.get(`/admin/orders/${orderId}`)
    return response.data
  },

  async updateOrderStatus(orderId, status, note) {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status, note })
    return response.data
  },

  async assignDroneToOrder(orderId) {
    const response = await api.post(`/admin/orders/${orderId}/assign-drone`)
    return response.data
  },

  // Drone management
  async getAllDrones(params = {}) {
    const response = await api.get('/admin/drones', { params })
    return response.data
  },

  async getDroneById(droneId) {
    const response = await api.get(`/admin/drones/${droneId}`)
    return response.data
  },

  async updateDroneStatus(droneId, status) {
    const response = await api.patch(`/admin/drones/${droneId}/status`, { status })
    return response.data
  },

  // Mission management
  async getAllMissions(params = {}) {
    const response = await api.get('/admin/missions', { params })
    return response.data
  },

  async getMissionById(missionId) {
    const response = await api.get(`/admin/missions/${missionId}`)
    return response.data
  },

  // System management
  async getSystemStats() {
    const response = await api.get('/admin/system/stats')
    return response.data
  },

  async getSystemLogs(params = {}) {
    const response = await api.get('/admin/system/logs', { params })
    return response.data
  },

  // Analytics
  async getAnalytics(params = {}) {
    const response = await api.get('/admin/analytics', { params })
    return response.data
  },

  async getRevenueReport(params = {}) {
    const response = await api.get('/admin/analytics/revenue', { params })
    return response.data
  },
// Tổng doanh thu toàn hệ thống
async getTotalRevenue(params = {}) {
  const response = await api.get('/admin/analytics/total-revenue', { params })
  return response.data
},

  async getOrderReport(params = {}) {
    const response = await api.get('/admin/analytics/orders', { params })
    return response.data
  }
}

