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

          toast.success(`Welcome back, ${user.name}!`)
          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ isLoading: true })
          
          const response = await authService.register(userData)
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

          toast.success(`Welcome to FFDD, ${user.name}!`)
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
          
          toast.success('Logged out successfully')
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

          toast.success('Profile updated successfully')
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

          toast.success('Password changed successfully')
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

          toast.success('Password reset link sent to your email')
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

          toast.success('Password reset successfully')
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
            // Check if token is expired
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            const currentTime = Date.now() / 1000
            
            if (payload.exp < currentTime) {
              // Token is expired, try to refresh
              try {
                await authService.refreshToken()
                const parsedUser = JSON.parse(user)
                set({ user: parsedUser, isAuthenticated: true })
              } catch (refreshError) {
                // Refresh failed, logout
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                set({ user: null, isAuthenticated: false })
              }
            } else {
              // Token is valid
              const parsedUser = JSON.parse(user)
              set({ user: parsedUser, isAuthenticated: true })
            }
          } catch (error) {
            console.error('Error parsing user from localStorage:', error)
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            set({ user: null, isAuthenticated: false })
          }
        }
      },

      // Force logout (for token expiration)
      forceLogout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
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
