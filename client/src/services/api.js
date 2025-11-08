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

    // Check if this is a pending approval error - don't try to refresh token
    if (error.response?.status === 401 && error.response?.data?.data?.pendingApproval) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh token if we're on login page (login failed)
      if (window.location.pathname.includes('/login')) {
        return Promise.reject(error)
      }

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
        if (refreshToken && refreshToken.split('.').length === 3) {
          const response = await axios.post(`${api.defaults.baseURL}/user/refresh`, {
            refreshToken
          })

          // Support both response.data and response.data.data shapes
          const payload = response.data?.data || response.data
          const { accessToken, refreshToken: newRefreshToken } = payload
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          processQueue(null, accessToken)

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          // No refresh token available, logout immediately
          processQueue(error, null)
          
          // Only logout and redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            const { logout } = useAuthStore.getState()
            await logout()
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null)
        
        // Only logout and redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          const { logout } = useAuthStore.getState()
          
          // Clear potentially corrupted tokens
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          await logout()
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle other errors (skip 401 and pending approval errors)
    const isPendingApproval = error.response?.data?.data?.pendingApproval
    if (error.response?.status !== 401 && !isPendingApproval) {
      // Allow callers to suppress the global error toast by setting
      // `hideGlobalErrorToast` on the request config (useful when the
      // caller shows its own toasts to avoid duplicate notifications).
      const hideGlobal = originalRequest?.hideGlobalErrorToast || originalRequest?.headers?.['x-hide-global-error-toast']
      if (!hideGlobal) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        } else if (error.message && error.message !== 'Network Error') {
          toast.error(error.message)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
