import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

// Hook to check token expiration and auto logout
export const useAuthGuard = () => {
  const { logout, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    let refreshTimeout = null

    const scheduleTokenRefresh = () => {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        logout()
        return
      }

      // Check if token is expired or will expire soon
      if (isTokenExpired(accessToken)) {
        // Token already expired, try to refresh immediately
        handleTokenRefresh()
        return
      }

      // Get token expiration time
      const expirationTime = getTokenExpirationTime(accessToken)
      if (!expirationTime) {
        logout()
        return
      }

      // Schedule refresh 5 minutes before expiration
      const now = Date.now()
      const timeUntilExpiry = expirationTime.getTime() - now
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000) // 5 minutes before expiration

      console.log(`Token will be refreshed in ${Math.round(refreshTime / 1000 / 60)} minutes`)

      refreshTimeout = setTimeout(() => {
        handleTokenRefresh()
      }, refreshTime)
    }

    const handleTokenRefresh = async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          await logout()
          return
        }

        // Try to refresh token
        const response = await authService.refreshToken()
        const { accessToken, refreshToken: newRefreshToken } = response.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        console.log('Token refreshed successfully')
        
        // Schedule next refresh
        scheduleTokenRefresh()
      } catch (error) {
        console.error('Token refresh failed:', error)
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        await logout()
      }
    }

    // Initial schedule
    scheduleTokenRefresh()

    // Cleanup
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [isAuthenticated, logout])
}

// Hook to decode JWT token and check expiration
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    
    // Check if token is expired (already past expiration time)
    return payload.exp < currentTime
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
