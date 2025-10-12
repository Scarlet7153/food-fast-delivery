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
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Fast Food Delivery Drone
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Order food delivered by drones
          </p>
        </div>

        {/* Content */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            © 2024 Fast Food Delivery Drone. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
