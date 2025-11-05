import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),


      // Login
      login: async (credentials) => {
        try {
          set({ isLoading: true })
          
          // Clear any existing cache before login
          if (window.queryClient) {
            window.queryClient.clear()
          }
          
          const response = await authService.login(credentials)
          const { user, accessToken, refreshToken } = response.data

          // Store tokens and user data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          localStorage.setItem('user', JSON.stringify(user))

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })

          toast.success(`Chào mừng trở lại, ${user.name}!`)
          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          // Don't show default error toast here, let the component handle specific errors
          throw error
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ isLoading: true })
          
          // Clear any existing cache before register
          if (window.queryClient) {
            window.queryClient.clear()
          }
          
          const response = await authService.register(userData)
          
          // For restaurant registration, don't auto-login as they need approval
          if (userData.role === 'restaurant') {
            const { user } = response.data
            set({ isLoading: false })
            return { success: true, user }
          }

          // For other roles, auto-login as before
          const { user, accessToken, refreshToken } = response.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          localStorage.setItem('user', JSON.stringify(user))

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })

          toast.success(`Chào mừng đến với FFDD, ${user.name}!`)
          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear state and localStorage
          set({ user: null, isAuthenticated: false })
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          // Clear all cached data in localStorage that might be user-specific
          // Remove any cached restaurant data, orders, etc.
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('restaurant-') || 
                key.startsWith('order-') || 
                key.startsWith('mission-') ||
                key.startsWith('drone-') ||
                key.startsWith('menu-')) {
              localStorage.removeItem(key)
            }
          })
          
          // Clear React Query cache (if available)
          if (window.queryClient) {
            window.queryClient.clear()
          }
          
          toast.success('Đăng xuất thành công')
          
          // Force reload to clear all state
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true })
          
          const response = await authService.updateProfile(profileData)
          const { user } = response.data

          // Update stored user data
          localStorage.setItem('user', JSON.stringify(user))
          set({ user, isLoading: false })

          toast.success('Cập nhật thông tin thành công')
          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Change password
      changePassword: async (passwordData) => {
        try {
          set({ isLoading: true })
          
          await authService.changePassword(passwordData)
          set({ isLoading: false })

          toast.success('Đổi mật khẩu thành công')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Forgot password
      forgotPassword: async (email) => {
        try {
          set({ isLoading: true })
          
          await authService.forgotPassword(email)
          set({ isLoading: false })

          toast.success('Link đặt lại mật khẩu đã được gửi đến email của bạn')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Reset password
      resetPassword: async (token, newPassword) => {
        try {
          set({ isLoading: true })
          
          await authService.resetPassword(token, newPassword)
          set({ isLoading: false })

          toast.success('Đặt lại mật khẩu thành công')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Refresh user data
      refreshUser: async () => {
        try {
          const response = await authService.getProfile()
          const { user } = response.data

          // Update stored user data
          localStorage.setItem('user', JSON.stringify(user))
          set({ user })

          return { success: true, user }
        } catch (error) {
          console.error('Error refreshing user:', error)
          throw error
        }
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.includes(user?.role)
      },

      // Get user's restaurant ID (for restaurant owners)
      getRestaurantId: () => {
        const { user } = get()
        return user?.restaurantId
      },

      initializeAuth: async () => {
        const user = localStorage.getItem('user')
        const accessToken = localStorage.getItem('accessToken')
        
        if (user && accessToken) {
          try {
            // Parse user first
            const parsedUser = JSON.parse(user)
            
            // Check if token is expired
            const parts = accessToken.split('.')
            if (parts.length !== 3) {
              throw new Error('Invalid token format')
            }
            
            const payload = JSON.parse(atob(parts[1]))
            const currentTime = Date.now() / 1000
            
            if (payload.exp < currentTime) {
              // Token is expired, try to refresh
              try {
                const response = await authService.refreshToken()
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data
                
                localStorage.setItem('accessToken', newAccessToken)
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken)
                }
                
                set({ user: parsedUser, isAuthenticated: true })
              } catch (refreshError) {
                // Refresh failed, clear auth state
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                set({ user: null, isAuthenticated: false })
              }
            } else {
              // Token is still valid
              set({ user: parsedUser, isAuthenticated: true })
            }
          } catch (error) {
            console.error('Error initializing auth:', error)
            // Clear invalid data
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            set({ user: null, isAuthenticated: false })
          }
        }
      },

      // Force logout (for token expiration)
      forceLogout: () => {
        // Clear state and localStorage
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        // Clear all cached data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('restaurant-') || 
              key.startsWith('order-') || 
              key.startsWith('mission-') ||
              key.startsWith('drone-') ||
              key.startsWith('menu-')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear React Query cache
        if (window.queryClient) {
          window.queryClient.clear()
        }
        
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

export { useAuthStore }
