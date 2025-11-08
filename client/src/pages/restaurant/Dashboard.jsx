import { useQuery } from 'react-query'
import { orderService } from '../../services/orderService'
import { 
  ShoppingBag, DollarSign, Clock, Users, TrendingUp,
  Truck, AlertTriangle, CheckCircle, Package
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'
import { t } from '../../utils/translations'

function RestaurantDashboard() {
  // Fetch restaurant statistics
  const { data: statsData, isLoading } = useQuery(
    'restaurant-stats',
    () => orderService.getRestaurantOrderStats(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  )

  // Fetch recent orders
  const { data: ordersData } = useQuery(
    'restaurant-recent-orders',
    () => orderService.getRestaurantOrders({ limit: 5, sortBy: 'newest' }),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 10 * 1000, // Refetch every 10 seconds
    }
  )

  const stats = statsData?.data?.stats || {}
  const recentOrders = ordersData?.data?.orders || []
  
  // Log để debug
  console.log('Stats Data:', statsData)
  console.log('Stats:', stats)
  console.log('Total Revenue:', stats.totalRevenue)

  // Format số liệu cho đơn vị TB/đơn
  const avgOrderValue = {
    today: stats.todayOrders ? (stats.todayRevenue / stats.todayOrders) : 0,
    total: stats.totalOrders ? (stats.totalRevenue / stats.totalOrders) : 0
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-100'
      case 'COOKING':
        return 'text-yellow-600 bg-yellow-100'
      case 'READY_FOR_PICKUP':
        return 'text-orange-600 bg-orange-100'
      case 'IN_FLIGHT':
        return 'text-purple-600 bg-purple-100'
      case 'DELIVERED':
        return 'text-green-600 bg-green-100'
      case 'CANCELLED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
        return <Package className="h-4 w-4" />
      case 'COOKING':
        return <Clock className="h-4 w-4" />
      case 'READY_FOR_PICKUP':
        return <Truck className="h-4 w-4" />
      case 'IN_FLIGHT':
        return <Truck className="h-4 w-4" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalRevenue || 0)}
              </p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <ShoppingBag className="h-3 w-3 mr-1" />
                {stats.totalOrders || 0} đơn • {formatCurrency(avgOrderValue.total)} TB/đơn
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh Thu Hôm Nay</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.todayRevenue || 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.todayOrders || 0} đơn • {formatCurrency(avgOrderValue.today)} TB/đơn
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn Đang Xử Lý</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.activeOrders || 0}
              </p>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {stats.activeOrders > 0 ? 'Đang tiến hành' : 'Không có đơn xử lý'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đánh Giá TB</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalReviews > 0 ? (stats.averageRating?.toFixed(1) || '0.0') : '--'}
              </p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                {stats.totalReviews || 0} đánh giá
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu Hướng Doanh Thu
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Biểu đồ doanh thu sẽ hiển thị ở đây</p>
            </div>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Đơn Hàng Theo Trạng Thái
          </h3>
          <div className="space-y-4">
            {[
              { status: 'PLACED', count: stats.ordersByStatus?.PLACED || 0, color: 'bg-blue-500' },
              { status: 'COOKING', count: stats.ordersByStatus?.COOKING || 0, color: 'bg-yellow-500' },
              { status: 'READY_FOR_PICKUP', count: stats.ordersByStatus?.READY_FOR_PICKUP || 0, color: 'bg-orange-500' },
              { status: 'IN_FLIGHT', count: stats.ordersByStatus?.IN_FLIGHT || 0, color: 'bg-purple-500' },
              { status: 'DELIVERED', count: stats.ordersByStatus?.DELIVERED || 0, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {formatOrderStatus(item.status)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Đơn Hàng Gần Đây
            </h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Xem tất cả đơn hàng
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Đơn #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} món • {formatCurrency(order.amount?.total || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toLowerCase().replace('_', ' ')}
                    </span>
                    {order.deliveryMission && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Truck className="h-3 w-3" />
                        <span>Drone #{order.deliveryMission.drone?.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có đơn hàng
              </h3>
              <p className="text-gray-500">
                Đơn hàng sẽ hiển thị ở đây khi khách hàng đặt.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default RestaurantDashboard