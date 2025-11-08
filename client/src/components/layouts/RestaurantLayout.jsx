import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useEffect, useState } from 'react'
import { restaurantService } from '../../services/restaurantService'
import toast from 'react-hot-toast'
import { 
  BarChart3, ShoppingBag, Utensils, Plane, MapPin, 
  Info, User, Bell, LogOut
} from 'lucide-react'

function RestaurantLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(true)
  
  // Use auth guard to check token expiration
  useAuthGuard()

  const handleLogout = async () => {
    await logout()
    navigate('/customer', { replace: true })
  }

  // Load restaurant status for owner
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await restaurantService.getMyRestaurant()
        if (mounted) setIsOpen(res.data.restaurant?.isOpen ?? true)
      } catch (err) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleToggleStatus = async () => {
    const newState = !isOpen
    // optimistic update
    setIsOpen(newState)
    try {
      const res = await restaurantService.toggleRestaurantStatus()
      const serverState = res.data.isOpen
      // if server returns explicit state, use it; otherwise keep optimistic
      if (typeof serverState === 'boolean') setIsOpen(serverState)
      toast.success(`Cửa hàng đã ${serverState ? 'mở cửa' : 'đóng cửa'}`)
    } catch (err) {
      // revert optimistic update
      setIsOpen(!newState)
      toast.error('Không thể thay đổi trạng thái cửa hàng')
    }
  }

  const navigation = [
    { name: 'Bảng Điều Khiển', href: '/restaurant', icon: BarChart3 },
    { name: 'Đơn Hàng', href: '/restaurant/orders', icon: ShoppingBag },
    { name: 'Thực Đơn', href: '/restaurant/menu', icon: Utensils },
    { name: 'Drone', href: '/restaurant/drones', icon: Plane },
    { name: 'Giao Hàng', href: '/restaurant/missions', icon: MapPin },
    { name: 'Thông Tin', href: '/restaurant/settings', icon: Info },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link to="/restaurant" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
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
            <span className="text-xl font-bold text-gray-900">FFDD</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Chủ Nhà Hàng
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Bảng Điều Khiển Nhà Hàng
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý nhà hàng và giao hàng bằng drone
                </p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                {/* Toggle switch + status text */}
                <div className="flex items-center space-x-3">
                  <label className="flex items-center cursor-pointer">
                    {/* Hidden checkbox */}
                    <input
                      type="checkbox"
                      checked={!!isOpen}
                      onChange={handleToggleStatus}
                      className="sr-only"
                      aria-label="Chuyển trạng thái cửa hàng"
                    />
                    {/* Switch */}
                    <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${isOpen ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isOpen ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </label>

                  {/* Status text on the right */}
                  <div className="text-sm font-medium">
                    {isOpen ? (
                      <span className="text-green-600">Đang hoạt động</span>
                    ) : (
                      <span className="text-red-600">Đang đóng cửa</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button className="p-2 bg-white rounded-lg shadow-md">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default RestaurantLayout