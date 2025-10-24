import api from './api'
import axios from 'axios'

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/user/register', userData)
    return response.data
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/user/login', credentials)
    return response.data
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get('/user/me')
    return response.data
  },

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/user/profile', profileData)
    return response.data
  },

  // Change password
  async changePassword(passwordData) {
    const response = await api.put('/user/change-password', passwordData)
    return response.data
  },

  // Logout
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await api.post('/user/logout', { refreshToken })
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
    if (!refreshToken || refreshToken.split('.').length !== 3) {
      throw new Error('No valid refresh token available')
    }

    // Use axios directly to avoid interceptor loop
    const baseURL = import.meta.env.VITE_API_URL || '/api'
    const response = await axios.post(`${baseURL}/user/refresh`, { refreshToken })
    return response.data
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/user/forgot-password', { email })
    return response.data
  },

  // Reset password
  async resetPassword(token, password) {
    const response = await api.post('/user/reset-password', { 
      token, 
      password 
    })
    return response.data
  }
}
