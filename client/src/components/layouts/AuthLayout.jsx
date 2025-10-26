import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

function AuthLayout({ children }) {
  const { isAuthenticated } = useAuthStore()

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Content */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center">          
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
