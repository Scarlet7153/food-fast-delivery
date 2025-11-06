import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { droneService } from '../../services/droneService'
import api from '../../services/api'
import { 
  Search, Filter, Clock, MapPin, Star, Eye, CheckCircle,
  Truck, XCircle, AlertCircle, Package, Utensils, Loader2, Plane,
  MapPin as LocationIcon, Zap
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function RestaurantOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showDroneConfirmModal, setShowDroneConfirmModal] = useState(false)
  const [selectedOrderForDrone, setSelectedOrderForDrone] = useState(null)
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

  // Assign drone mutation
  const assignDroneMutation = useMutation(
    (orderId) => orderService.assignDroneToOrder(orderId),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['restaurant-orders'])
        const droneName = data?.data?.drone?.name || 'Drone'
        toast.success(`${droneName} đã được giao thành công!`)
      },
      onError: (error) => {
        console.error('Assign drone error:', error)
        toast.error(error.response?.data?.error || 'Không thể giao drone. Vui lòng thử lại.')
      }
    }
  )

  const orders = ordersData?.data?.orders || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Đơn' },
    { value: 'PLACED', label: 'Đã Đặt' },
    { value: 'COOKING', label: 'Đang Chuẩn Bị' },
    { value: 'IN_FLIGHT', label: 'Đang Giao' },
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
    // When confirming an order, automatically set to COOKING instead
    if (newStatus === 'CONFIRMED') {
      updateStatusMutation.mutate({ 
        orderId, 
        status: 'COOKING', 
        note: note || 'Đã xác nhận và bắt đầu chuẩn bị món'
      })
    } else {
      updateStatusMutation.mutate({ orderId, status: newStatus, note })
    }
  }

  const handleAssignDrone = (order) => {
    setSelectedOrderForDrone(order)
    setShowDroneConfirmModal(true)
  }

  const confirmAssignDrone = () => {
    if (selectedOrderForDrone) {
      assignDroneMutation.mutate(selectedOrderForDrone._id)
      setShowDroneConfirmModal(false)
      setSelectedOrderForDrone(null)
    }
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PLACED':
        return { status: 'CONFIRMED', label: 'Xác Nhận Đơn', icon: CheckCircle }
      case 'CONFIRMED':
      case 'COOKING':
        return { status: 'ASSIGN_DRONE', label: 'Giao Cho Drone', icon: Plane }
      case 'READY_FOR_PICKUP':
        return { status: 'ASSIGN_DRONE', label: 'Giao Cho Drone', icon: Plane }
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
            className="bg-gray-100 hover:bg-gray-200 text-blue-600 border border-gray-300 px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200"
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
                onAssignDrone={() => handleAssignDrone(order)}
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                isUpdating={updateStatusMutation.isLoading || assignDroneMutation.isLoading}
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

      {/* Drone Assignment Confirmation Modal */}
      {showDroneConfirmModal && selectedOrderForDrone && (
        <DroneAssignmentModal
          order={selectedOrderForDrone}
          onConfirm={confirmAssignDrone}
          onCancel={() => {
            setShowDroneConfirmModal(false)
            setSelectedOrderForDrone(null)
          }}
          isLoading={assignDroneMutation.isLoading}
        />
      )}
    </div>
  )
}

// Order Card Component
function OrderCard({ order, onStatusUpdate, onAssignDrone, getNextStatus, getStatusIcon, getStatusColor, isUpdating }) {
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
                <span>{formatCurrency(order.amount?.total || 0)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              
              {order.deliveryAddress && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{order.deliveryAddress.text}</span>
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
            
            {/* Drone Assignment Info */}
            {order.status === 'IN_FLIGHT' && order.missionId && (
              <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <Plane className="h-3 w-3" />
                <span>Đã giao cho drone - Mission #{order.missionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Link 
            to={`/restaurant/orders/${order._id}`}
            className="btn btn-outline btn-sm flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Xem</span>
          </Link>

          {canUpdate && nextStatus && (
            <>
              {nextStatus.status === 'ASSIGN_DRONE' ? (
                <button
                  onClick={() => onAssignDrone()}
                  disabled={isUpdating}
                  className="btn btn-primary btn-sm flex items-center space-x-1 bg-blue-600 hover:bg-blue-700"
                  title="Hệ thống sẽ tự động chọn drone rảnh phù hợp nhất"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plane className="h-4 w-4" />
                  )}
                  <span>{nextStatus.label}</span>
                </button>
              ) : (
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
            </>
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

// Drone Assignment Confirmation Modal
function DroneAssignmentModal({ order, onConfirm, onCancel, isLoading }) {
  const [selectedDrone, setSelectedDrone] = useState(null)
  const [loadingDrone, setLoadingDrone] = useState(false)

  // Fetch available drones when modal opens
  useEffect(() => {
    const fetchAvailableDrones = async () => {
      setLoadingDrone(true)
      try {
        // Fetch all drones first - temporary fix
        const response = await api.get('/drones')
        const allDrones = response.data.data.drones || []
        
        // Filter only IDLE drones
        const idleDrones = allDrones.filter(drone => drone.status === 'IDLE')
        
        if (idleDrones.length > 0) {
          // Select the first IDLE drone
          setSelectedDrone(idleDrones[0])
        } else {
          setSelectedDrone(null)
        }
      } catch (error) {
        console.error('Failed to fetch available drones:', error)
        setSelectedDrone(null)
      } finally {
        setLoadingDrone(false)
      }
    }

    fetchAvailableDrones()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Giao Cho Drone</h3>
              <p className="text-blue-100 text-sm">Xác nhận giao đơn hàng cho drone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Thông tin đơn hàng</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn:</span>
                <span className="font-medium">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Khách hàng:</span>
                <span className="font-medium">{order.customer?.name || 'Không rõ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-medium text-green-600">{formatCurrency(order.amount?.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số món:</span>
                <span className="font-medium">{order.items.length} món</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <LocationIcon className="h-4 w-4" />
                <span>Địa chỉ giao hàng</span>
              </h4>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{order.deliveryAddress.text}</p>
                {order.deliveryAddress.notes && (
                  <p className="mt-1 text-gray-500">Ghi chú: {order.deliveryAddress.notes}</p>
                )}
                {order.deliveryAddress.contactPhone && (
                  <p className="mt-1 text-gray-500">SĐT: {order.deliveryAddress.contactPhone}</p>
                )}
              </div>
            </div>
          )}

          {/* Selected Drone Info */}
          {loadingDrone ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Đang tìm drone phù hợp...</span>
              </div>
            </div>
          ) : selectedDrone ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                <Plane className="h-4 w-4" />
                <span>Drone được chọn</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tên drone:</span>
                  <span className="text-sm font-medium text-green-800">{selectedDrone.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Model:</span>
                  <span className="text-sm font-medium text-green-800">{selectedDrone.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tải trọng tối đa:</span>
                  <span className="text-sm font-medium text-green-800">{selectedDrone.maxPayloadGrams}g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tầm bay:</span>
                  <span className="text-sm font-medium text-green-800">{selectedDrone.maxRangeMeters}m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">Không có drone rảnh để giao hàng</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !selectedDrone}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang giao...</span>
              </>
            ) : (
              <>
                <Plane className="h-4 w-4" />
                <span>Xác nhận giao drone</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantOrders