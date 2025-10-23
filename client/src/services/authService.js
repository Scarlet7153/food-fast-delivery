import api from './api'
import axios from 'axios'

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  // Change password
  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData)
    return response.data
  },

  // Logout
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },

  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    // Use axios directly to avoid interceptor loop
    const baseURL = import.meta.env.VITE_API_URL || '/api'
    const response = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken })
    return response.data
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Reset password
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { 
      token, 
      password 
    })
    return response.data
  }
}
