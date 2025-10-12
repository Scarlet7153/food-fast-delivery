import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { orderService } from '../../services/orderService'
import { 
  Search, Filter, Clock, MapPin, Star, Eye, CheckCircle,
  Truck, XCircle, AlertCircle, Package, Utensils, Loader2
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function RestaurantOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const queryClient = useQueryClient()

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery(
    ['restaurant-orders', { search: searchQuery, status: statusFilter, sortBy }],
    () => orderService.getRestaurantOrders({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy
    }),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    }
  )

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status, note }) => orderService.updateOrderStatus(orderId, status, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-orders'])
        toast.success('Cập nhật trạng thái đơn hàng thành công')
      },
      onError: (error) => {
        toast.error('Không thể cập nhật trạng thái đơn hàng')
      }
    }
  )

  const orders = ordersData?.data?.orders || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Đơn' },
    { value: 'PLACED', label: 'Đã Đặt' },
    { value: 'CONFIRMED', label: 'Đã Xác Nhận' },
    { value: 'COOKING', label: 'Đang Nấu' },
    { value: 'READY_FOR_PICKUP', label: 'Sẵn Sàng' },
    { value: 'IN_FLIGHT', label: 'Đang Bay' },
    { value: 'DELIVERED', label: 'Đã Giao' },
    { value: 'CANCELLED', label: 'Đã Hủy' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Mới Nhất' },
    { value: 'oldest', label: 'Cũ Nhất' },
    { value: 'total', label: 'Giá Trị Cao' },
    { value: 'status', label: 'Theo Trạng Thái' },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'IN_FLIGHT':
      case 'COOKING':
      case 'READY_FOR_PICKUP':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
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

  const handleStatusUpdate = (orderId, newStatus, note = '') => {
    updateStatusMutation.mutate({ orderId, status: newStatus, note })
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PLACED':
        return { status: 'CONFIRMED', label: 'Xác Nhận Đơn', icon: CheckCircle }
      case 'CONFIRMED':
        return { status: 'COOKING', label: 'Bắt Đầu Nấu', icon: Utensils }
      case 'COOKING':
        return { status: 'READY_FOR_PICKUP', label: 'Sẵn Sàng', icon: Package }
      case 'READY_FOR_PICKUP':
        return { status: 'IN_FLIGHT', label: 'Giao Cho Drone', icon: Truck }
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
        <p className="text-gray-600 mt-1">
          Quản lý đơn hàng đến và theo dõi trạng thái
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
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
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

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input lg:w-48"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                onStatusUpdate={handleStatusUpdate}
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                isUpdating={updateStatusMutation.isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Không có đơn hàng phù hợp với bộ lọc.'
                : 'Chưa có đơn hàng nào được đặt.'
              }
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="btn btn-primary"
              >
                Xóa Bộ Lọc
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

// Order Card Component
function OrderCard({ order, onStatusUpdate, getNextStatus, getStatusIcon, getStatusColor, isUpdating }) {
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  
  const nextStatus = getNextStatus(order.status)
  const canUpdate = ['PLACED', 'CONFIRMED', 'COOKING', 'READY_FOR_PICKUP'].includes(order.status)

  const handleUpdateStatus = (newStatus) => {
    if (showNoteInput) {
      onStatusUpdate(order._id, newStatus, note)
      setShowNoteInput(false)
      setNote('')
    } else {
      onStatusUpdate(order._id, newStatus)
    }
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Order Icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {getStatusIcon(order.status)}
          </div>

          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Đơn #{order.orderNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Khách hàng: {order.customer?.name || 'Không rõ'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {formatOrderStatus(order.status)}
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span>{order.items.length} món</span>
                <span>•</span>
                <span>{formatCurrency(order.totalAmount)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              
              {order.deliveryAddress && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{order.deliveryAddress.street}</span>
                </div>
              )}
            </div>

            {/* Items Preview */}
            <div className="flex flex-wrap gap-2 mb-3">
              {order.items.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {item.quantity}x {item.name}
                </span>
              ))}
              {order.items.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{order.items.length - 3} món nữa
                </span>
              )}
            </div>

            {/* Mission Info */}
            {order.deliveryMission && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Truck className="h-3 w-3" />
                <span>Drone #{order.deliveryMission.drone?.name}</span>
                {order.deliveryMission.estimatedArrival && (
                  <>
                    <span>•</span>
                    <span>ETA: {formatDateTime(order.deliveryMission.estimatedArrival)}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button className="btn btn-outline btn-sm flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>Xem</span>
          </button>

          {canUpdate && nextStatus && (
            <button
              onClick={() => handleUpdateStatus(nextStatus.status)}
              disabled={isUpdating}
              className={`btn btn-primary btn-sm flex items-center space-x-1 ${
                nextStatus.status === 'CONFIRMED' ? 'bg-green-600 hover:bg-green-700' :
                nextStatus.status === 'COOKING' ? 'bg-yellow-600 hover:bg-yellow-700' :
                nextStatus.status === 'READY_FOR_PICKUP' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <nextStatus.icon className="h-4 w-4" />
              )}
              <span>{nextStatus.label}</span>
            </button>
          )}

          {order.status === 'PLACED' && (
            <button
              onClick={() => {
                const reason = window.prompt('Lý do hủy:')
                if (reason) {
                  onStatusUpdate(order._id, 'CANCELLED', reason)
                }
              }}
              className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Yêu Cầu Đặc Biệt:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      {/* Note Input */}
      {showNoteInput && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thêm Ghi Chú (Tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Thêm ghi chú về đơn hàng này..."
          />
        </div>
      )}
    </div>
  )
}

export default RestaurantOrders