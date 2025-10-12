import api from './api'

export const restaurantService = {
  // Get all restaurants
  async getRestaurants(params = {}) {
    const response = await api.get('/restaurants', { params })
    return response.data
  },

  // Get single restaurant
  async getRestaurant(id) {
    const response = await api.get(`/restaurants/${id}`)
    return response.data
  },

  // Get restaurant menu
  async getRestaurantMenu(id, params = {}) {
    const response = await api.get(`/restaurants/${id}/menu`, { params })
    return response.data
  },

  // Create restaurant (restaurant owner)
  async createRestaurant(restaurantData) {
    const response = await api.post('/restaurants', restaurantData)
    return response.data
  },

  // Update restaurant (restaurant owner)
  async updateRestaurant(id, restaurantData) {
    const response = await api.put(`/restaurants/${id}`, restaurantData)
    return response.data
  },

  // Get restaurant statistics (restaurant owner)
  async getRestaurantStats(id, params = {}) {
    const response = await api.get(`/restaurants/${id}/stats`, { params })
    return response.data
  },

  // Admin: Get pending restaurants
  async getPendingRestaurants(params = {}) {
    const response = await api.get('/admin/restaurants/pending', { params })
    return response.data
  },

  // Admin: Approve restaurant
  async approveRestaurant(id) {
    const response = await api.patch(`/admin/restaurants/${id}/approve`)
    return response.data
  },

  // Admin: Reject restaurant
  async rejectRestaurant(id, reason) {
    const response = await api.patch(`/admin/restaurants/${id}/reject`, { reason })
    return response.data
  },

  // For restaurant owner to get their own restaurant
  async getMyRestaurant() {
    const response = await api.get('/restaurants/me')
    return response.data
  },

  // For restaurant owner to update their own restaurant
  async updateMyRestaurant(restaurantData) {
    const response = await api.put('/restaurants/me', restaurantData)
    return response.data
  },

  // Menu item operations
  async createMenuItem(restaurantId, itemData) {
    const response = await api.post(`/restaurants/${restaurantId}/menu`, itemData)
    return response.data
  },

  async updateMenuItem(restaurantId, itemId, itemData) {
    const response = await api.put(`/restaurants/${restaurantId}/menu/${itemId}`, itemData)
    return response.data
  },

  async deleteMenuItem(restaurantId, itemId) {
    const response = await api.delete(`/restaurants/${restaurantId}/menu/${itemId}`)
    return response.data
  }
}
