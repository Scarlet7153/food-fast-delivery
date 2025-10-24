import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'

// Layouts
import AuthLayout from './components/layouts/AuthLayout'
import CustomerLayout from './components/layouts/CustomerLayout'
import RestaurantLayout from './components/layouts/RestaurantLayout'
import AdminLayout from './components/layouts/AdminLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerRegister from './pages/auth/CustomerRegister'
import RestaurantRegister from './pages/auth/RestaurantRegister'

// Customer Pages
import CustomerHome from './pages/customer/Home'
import Restaurants from './pages/customer/Restaurants'
import RestaurantDetail from './pages/customer/RestaurantDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import OrderDetail from './pages/customer/OrderDetail'
import Profile from './pages/customer/Profile'

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/Dashboard'
import RestaurantOrders from './pages/restaurant/Orders'
import RestaurantMenu from './pages/restaurant/Menu'
import RestaurantDrones from './pages/restaurant/Drones'
import RestaurantMissions from './pages/restaurant/Missions'
import RestaurantSettings from './pages/restaurant/Settings'

// Admin Pages
import AdminUsers from './pages/admin/Users'
import AdminRestaurants from './pages/admin/Restaurants'
import AdminOrders from './pages/admin/Orders'
import AdminDrones from './pages/admin/Drones'
import AdminMissions from './pages/admin/Missions'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// Role-based redirect
function RoleRedirect() {
  const { user } = useAuthStore()
  
  switch (user?.role) {
    case 'customer':
      return <Navigate to="/customer" replace />
    case 'restaurant':
      return <Navigate to="/restaurant" replace />
    case 'admin':
      return <Navigate to="/admin" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        } />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/register/restaurant" element={<RestaurantRegister />} />
        <Route path="/register/old" element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        } />

        {/* Root redirect */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Customer Routes */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CustomerHome />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="restaurants/:id" element={<RestaurantDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Restaurant Routes */}
        <Route path="/restaurant" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantLayout />
          </ProtectedRoute>
        }>
          <Route index element={<RestaurantDashboard />} />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route path="menu" element={<RestaurantMenu />} />
          <Route path="drones" element={<RestaurantDrones />} />
          <Route path="missions" element={<RestaurantMissions />} />
          <Route path="settings" element={<RestaurantSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="drones" element={<AdminDrones />} />
          <Route path="missions" element={<AdminMissions />} />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
              <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
        
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
