import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'

// Hook to check token expiration and auto logout
export const useAuthGuard = () => {
  const { logout, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const checkTokenExpiration = async () => {
      if (!isAuthenticated) return

      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        await logout()
        return
      }

      try {
        // Try to get profile to check if token is valid
        await authService.getProfile()
      } catch (error) {
        if (error.response?.status === 401) {
          // Token is invalid, try to refresh
          try {
            await authService.refreshToken()
          } catch (refreshError) {
            // Refresh failed, logout
            await logout()
          }
        }
      }
    }

    // Check token on mount
    checkTokenExpiration()

    // Set up interval to check token periodically (every 5 minutes)
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, logout])
}

// Hook to decode JWT token and check expiration
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    
    // Check if token is expired (with 30 seconds buffer)
    return payload.exp < (currentTime + 30)
  } catch (error) {
    console.error('Error decoding token:', error)
    return true
  }
}

// Hook to get token expiration time
export const getTokenExpirationTime = (token) => {
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return new Date(payload.exp * 1000)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}
