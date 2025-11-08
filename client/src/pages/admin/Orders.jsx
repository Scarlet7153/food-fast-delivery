import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminService } from '../../services/adminService'
import { 
  Search, Filter, ShoppingBag, Clock, MapPin, User, 
  CheckCircle, XCircle, AlertTriangle, Eye, Plane
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus, formatDistance } from '../../utils/formatters'
import { t } from '../../utils/translations'

function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery(
    ['admin-orders', { search: searchQuery, status: statusFilter, restaurant: restaurantFilter }],
    () => adminService.getAllOrders({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      restaurantId: restaurantFilter !== 'all' ? restaurantFilter : undefined
    }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const orders = ordersData?.data?.orders || []
  const restaurants = ordersData?.data?.restaurants || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Trạng Thái' },
    { value: 'PLACED', label: 'Đã đặt' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'COOKING', label: 'Đang nấu' },
    { value: 'READY_FOR_PICKUP', label: 'Sẵn sàng giao' },
    { value: 'IN_FLIGHT', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ]

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'IN_FLIGHT':
      case 'COOKING':
      case 'READY_FOR_PICKUP':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'IN_FLIGHT':
      case 'COOKING':
      case 'READY_FOR_PICKUP':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
        <p className="text-gray-600 mt-1">
          Theo dõi tất cả đơn hàng trên nền tảng
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo số đơn hàng, tên người nhận hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input lg:w-48"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Restaurant Filter */}
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="all">Tất Cả Nhà Hàng</option>
            {restaurants.map(restaurant => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số Tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} món
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.deliveryAddress?.contactName || 'Không xác định'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.deliveryAddress?.contactPhone || 'Chưa có thông tin'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.restaurant?.name || 'Nhà hàng không xác định'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.amount?.total || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không tìm thấy đơn hàng
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all' || restaurantFilter !== 'all'
                        ? 'Không có đơn hàng nào phù hợp với bộ lọc.'
                        : 'Chưa có đơn hàng nào được đặt.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  )
}

// Order Detail Modal Component
function OrderDetailModal({ order, onClose }) {
  const queryClient = useQueryClient()
  const [isAssigning, setIsAssigning] = useState(false)

  const assignDroneMutation = useMutation(
    (orderId) => adminService.assignDroneToOrder(orderId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-orders'])
        alert('Drone đã được giao thành công!')
        onClose()
      },
      onError: (error) => {
        alert(error.response?.data?.error || 'Không thể giao drone. Vui lòng thử lại.')
      }
    }
  )

  const handleAssignDrone = async () => {
    if (!confirm('Bạn có chắc muốn giao đơn hàng này cho drone không?')) {
      return
    }
    
    setIsAssigning(true)
    try {
      await assignDroneMutation.mutateAsync(order._id)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div 
      className="bg-black bg-opacity-50 flex items-center justify-center" 
      style={{ 
        zIndex: 99999, 
        position: 'fixed',
        top: '-100px',
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        transform: 'translateY(100px)'
      }}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Đơn Hàng #{order.orderNumber}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Thông Tin Khách Hàng</h3>
              <p className="text-sm text-gray-600">{order.deliveryAddress?.contactName || 'Không xác định'}</p>
              <p className="text-sm text-gray-600">{order.deliveryAddress?.contactPhone || 'Chưa có thông tin'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Nhà hàng</h3>
              <p className="text-sm text-gray-600">{order.restaurant?.name}</p>
              <p className="text-sm text-gray-600">{order.restaurant?.phone}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Tóm Tắt Đơn Hàng</h3>
              <p className="text-sm text-gray-600">Món ăn: {order.items.length}</p>
              <p className="text-sm text-gray-600">Tổng: {formatCurrency(order.amount?.total || 0)}</p>
              <p className="text-sm text-gray-600">Trạng thái: {formatOrderStatus(order.status)}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-medium mb-4">Món Ăn Đã Đặt</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{item.name}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Đơn giá:</span> {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Số lượng:</span> {item.quantity}
                      </p>
                    </div>
                    {item.specialInstructions && (
                      <p className="text-xs text-gray-500 italic mt-2">
                        Ghi chú: "{item.specialInstructions}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Thành tiền</p>
                    <p className="font-bold text-lg text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          {order.deliveryAddress && (
            <div>
              <h3 className="text-lg font-medium mb-4">Thông Tin Giao Hàng</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{order.deliveryAddress.text}</p>
                    <p className="text-sm text-gray-600">
                      Liên hệ: {order.deliveryAddress.contactName} - {order.deliveryAddress.contactPhone}
                    </p>
                    {order.deliveryAddress.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Ghi chú: {order.deliveryAddress.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drone Assignment Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Thông Tin Giao Hàng</h3>
              {order.status === 'READY_FOR_PICKUP' && !order.missionId && (
                <button
                  onClick={handleAssignDrone}
                  disabled={isAssigning}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plane className="h-4 w-4" />
                  <span>{isAssigning ? 'Đang giao...' : 'Giao Cho Drone'}</span>
                </button>
              )}
            </div>

            {order.missionId ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Đã giao cho Drone</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mission Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã Đơn Giao
                    </label>
                    <p className="text-gray-900">{order.missionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời Gian Dự Kiến
                    </label>
                    <p className="text-gray-900">
                      {order.estimatedDeliveryTime ? 
                        formatDateTime(order.estimatedDeliveryTime) : 
                        'Không có thông tin'
                      }
                    </p>
                  </div>
                  
                  {/* Drone Info */}
                  {order.droneInfo && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên Drone
                        </label>
                        <p className="text-gray-900 font-medium">{order.droneInfo.name}</p>
                        <p className="text-xs text-gray-600">{order.droneInfo.model}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tải Trọng Tối Đa
                        </label>
                        <p className="text-gray-900">{order.droneInfo.maxPayloadGrams}g</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tầm Bay
                        </label>
                        <p className="text-gray-900">{formatDistance(order.droneInfo.maxRangeMeters)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : order.status === 'READY_FOR_PICKUP' ? (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Đơn hàng sẵn sàng giao</h4>
                </div>
                <p className="text-sm text-yellow-800">
                  Đơn hàng đã được chuẩn bị xong và sẵn sàng để giao cho drone. Nhấn nút "Giao Cho Drone" để tự động chọn drone phù hợp.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h4 className="font-medium text-gray-700">Chưa sẵn sàng giao</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Đơn hàng cần ở trạng thái "Sẵn sàng giao" để có thể giao cho drone.
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-medium mb-4">Lịch Sử Đơn Hàng</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Đặt hàng</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
              
              {order.timeline?.map((event, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {event.status === 'PLACED' || event.status === 'DELIVERED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : event.status === 'CANCELLED' || event.status === 'FAILED' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatOrderStatus(event.status)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                    {event.note && (
                      <p className="text-xs text-gray-400 italic">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOrders
