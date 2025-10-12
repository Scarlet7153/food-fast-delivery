import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { 
  BarChart3, Users, Building2, ShoppingBag, Zap, MapPin, 
  Settings, User, Bell, LogOut, Shield, Activity
} from 'lucide-react'

function AdminLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Bảng Điều Khiển', href: '/admin', icon: BarChart3 },
    { name: 'Người Dùng', href: '/admin/users', icon: Users },
    { name: 'Nhà Hàng', href: '/admin/restaurants', icon: Building2 },
    { name: 'Đơn Hàng', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Drone', href: '/admin/drones', icon: Zap },
    { name: 'Nhiệm Vụ', href: '/admin/missions', icon: MapPin },
    { name: 'Cài Đặt', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FFDD Admin</span>
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
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Quản Trị Viên
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Bảng Quản Trị
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý nền tảng giao đồ ăn bằng Drone
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Hệ Thống Hoạt Động</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  5
                </span>
              </button>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>Người dùng: 247</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Drone hoạt động: 12</span>
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

      {/* Mobile Menu Overlay */}
      <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 hidden" id="mobile-menu-overlay">
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
          {/* Mobile menu content - same as sidebar */}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
