import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { adminService } from '../../services/adminService'
import socketService from '../../services/socketService'
import { 
  Users, Building2, ShoppingBag, Truck, DollarSign, 
  TrendingUp, Activity, AlertTriangle, CheckCircle,
  BarChart3, PieChart, MapPin, Clock
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('today')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['admin-dashboard', timeRange],
    () => adminService.getDashboardStats({ timeRange }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  )

  // Socket connection for real-time updates
  useEffect(() => {
    // Join admin dashboard room
    socketService.joinAdminDashboard()
    
    // Listen for system updates
    socketService.onRestaurantUpdate((data) => {
      // Refresh dashboard data when system events occur
      if (data.type === 'system_update') {
        window.location.reload() // Simple refresh for demo
      }
    })

    return () => {
      socketService.removeAllListeners()
    }
  }, [])

  const stats = dashboardData?.data?.stats || {}
  const recentActivity = dashboardData?.data?.recentActivity || []

  const timeRangeOptions = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm này' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Platform overview and system monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          change="+12%"
          changeType="positive"
        />
        
        <StatCard
          title="Active Restaurants"
          value={stats.activeRestaurants || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="green"
          change="+5%"
          changeType="positive"
        />
        
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="purple"
          change="+18%"
          changeType="positive"
        />
        
        <StatCard
          title="Platform Revenue"
          value={formatCurrency(stats.platformRevenue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
          change="+23%"
          changeType="positive"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Revenue Trends</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Revenue chart would be displayed here</p>
            </div>
          </div>
        </div>

        {/* Order Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order Status Distribution</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Hoàn thành</span>
              </div>
              <span className="font-medium">{stats.completedOrders || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="font-medium">{stats.inProgressOrders || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Đang chờ</span>
              </div>
              <span className="font-medium">{stats.pendingOrders || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Đã hủy</span>
              </div>
              <span className="font-medium">{stats.cancelledOrders || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Drones */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Drones</h2>
            <Truck className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Đang giao</span>
              </div>
              <span className="font-medium text-green-700">{stats.dronesInFlight || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Idle</span>
              </div>
              <span className="font-medium text-blue-700">{stats.dronesIdle || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Maintenance</span>
              </div>
              <span className="font-medium text-yellow-700">{stats.dronesMaintenance || 0}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="font-medium text-green-600">45ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Status</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Healthy</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Socket Connections</span>
              <span className="font-medium text-blue-600">{stats.activeConnections || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="font-medium text-green-600">0.1%</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Alerts</h2>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">High order volume detected</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New restaurant registered</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.type === 'info' ? 'bg-blue-100 text-blue-800' :
                    activity.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    activity.type === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recent activity
              </h3>
              <p className="text-gray-500">
                System activity will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color, change, changeType }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  }

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm ${changeColors[changeType]}`}>
            {change}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} bg-opacity-10`}>
          <div className={colorClasses[color]} style={{ color: 'inherit' }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
