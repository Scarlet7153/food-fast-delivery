import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // Increase to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track ongoing refresh requests to prevent multiple simultaneous refreshes
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          processQueue(null, accessToken)

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          // No refresh token available, logout immediately
          processQueue(error, null)
          const { logout } = useAuthStore.getState()
          await logout()
          
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null)
        const { logout } = useAuthStore.getState()
        await logout()
        
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle other errors (skip 401 errors as they're handled above)
    if (error.response?.status !== 401) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else if (error.message && error.message !== 'Network Error') {
        toast.error(error.message)
      }
    }

    return Promise.reject(error)
  }
)

export default api
