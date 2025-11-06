import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { orderService } from '../../services/orderService'
import socketService from '../../services/socketService'
import api from '../../services/api'
import { 
  ArrowLeft, MapPin, Clock, Phone, Star, Truck,
  CheckCircle, XCircle, AlertCircle, Loader2, Package, Utensils,
  Plane, Battery, Zap, MapPin as LocationIcon
} from 'lucide-react'
import { 
  formatCurrency, formatDateTime, formatOrderStatus, 
  formatMissionStatus, formatDistance 
} from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function RestaurantOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [showDroneConfirmModal, setShowDroneConfirmModal] = useState(false)

  // Fetch order details
  const { data: orderData, isLoading, refetch } = useQuery(
    ['restaurant-order', id],
    () => orderService.getOrder(id),
    {
      enabled: !!id,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    }
  )

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status, note }) => orderService.updateOrderStatus(orderId, status, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-order', id])
        queryClient.invalidateQueries(['restaurant-orders'])
        toast.success('Cập nhật trạng thái đơn hàng thành công')
        setShowNoteInput(false)
        setNote('')
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
        queryClient.invalidateQueries(['restaurant-order', id])
        queryClient.invalidateQueries(['restaurant-orders'])
        const droneName = data?.data?.drone?.name || 'Drone'
        toast.success(`${droneName} đã được giao thành công!`)
        setShowDroneConfirmModal(false)
      },
      onError: (error) => {
        console.error('Assign drone error:', error)
        toast.error(error.response?.data?.error || 'Không thể giao drone. Vui lòng thử lại.')
      }
    }
  )

  const order = orderData?.data?.order

  // Socket connection for real-time updates
  useEffect(() => {
    if (order) {
      // Join order tracking room
      socketService.joinOrderRoom(order._id)
      
      // Listen for order updates
      socketService.onOrderUpdate((data) => {
        if (data.orderId === order._id) {
          refetch()
          toast.success('Trạng thái đơn hàng đã cập nhật!')
        }
      })

      // Listen for mission updates
      socketService.onMissionUpdate((data) => {
        if (data.orderId === order._id) {
          refetch()
          toast.success('Trạng thái giao hàng đã cập nhật!')
        }
      })
    }

    return () => {
      socketService.removeAllListeners()
    }
  }, [order, refetch])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'IN_FLIGHT':
      case 'COOKING':
      case 'READY_FOR_PICKUP':
        return <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
      default:
        return <AlertCircle className="h-6 w-6 text-blue-500" />
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'PLACED': { status: 'CONFIRMED', label: 'Xác Nhận', icon: CheckCircle },
      'CONFIRMED': { status: 'ASSIGN_DRONE', label: 'Giao Cho Drone', icon: Plane },
      'COOKING': { status: 'ASSIGN_DRONE', label: 'Giao Cho Drone', icon: Plane },
      'READY_FOR_PICKUP': { status: 'IN_FLIGHT', label: 'Đang Giao', icon: Truck }
    }
    return statusFlow[currentStatus]
  }

  const handleUpdateStatus = (newStatus) => {
    // Handle drone assignment
    if (newStatus === 'ASSIGN_DRONE') {
      setShowDroneConfirmModal(true)
      return
    }
    
    // When confirming an order, automatically set to COOKING instead
    if (newStatus === 'CONFIRMED') {
      if (showNoteInput) {
        updateStatusMutation.mutate({ 
          orderId: id, 
          status: 'COOKING', 
          note: note || 'Đã xác nhận và bắt đầu chuẩn bị món'
        })
      } else {
        updateStatusMutation.mutate({ 
          orderId: id, 
          status: 'COOKING', 
          note: 'Đã xác nhận và bắt đầu chuẩn bị món'
        })
      }
    } else {
      if (showNoteInput) {
        updateStatusMutation.mutate({ orderId: id, status: newStatus, note })
      } else {
        updateStatusMutation.mutate({ orderId: id, status: newStatus })
      }
    }
  }

  const confirmAssignDrone = () => {
    assignDroneMutation.mutate(id)
  }

  const canUpdate = ['PLACED', 'CONFIRMED', 'COOKING', 'READY_FOR_PICKUP'].includes(order?.status)
  const nextStatus = order ? getNextStatus(order.status) : null

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-gray-600 mb-6">
          Đơn hàng bạn tìm kiếm không tồn tại hoặc bạn không có quyền xem.
        </p>
        <button
          onClick={() => navigate('/restaurant/orders')}
          className="btn btn-primary"
        >
          Quay Lại Đơn Hàng
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/restaurant/orders')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay Lại</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn Hàng #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Đặt lúc {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {formatOrderStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Order Timeline */}
      <OrderTimeline order={order} />

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Thông Tin Khách Hàng</h2>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <Phone className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {order.deliveryAddress?.contactName || 'Không rõ'}
            </h3>
            <p className="text-gray-600 mb-2">
              {order.deliveryAddress?.contactPhone || 'Không có số điện thoại'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{order.deliveryAddress?.text || 'Không có địa chỉ'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drone Info */}
      {order.missionId && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Plane className="h-5 w-5 text-blue-600" />
            <span>Thông Tin Drone Giao Hàng</span>
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tên drone:</span>
                <span className="text-sm font-medium text-blue-800">
                  {order.droneInfo?.name || 'Chưa phân công'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Model:</span>
                <span className="text-sm font-medium text-blue-800">
                  {order.droneInfo?.model || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mission ID:</span>
                <span className="text-sm font-medium text-blue-800 font-mono">
                  #{order.missionId?.slice(-8)}
                </span>
              </div>
            </div>
            
            {/* Mission Status */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Trạng thái giao hàng: 
                </span>
                <span className="text-sm text-blue-600">
                  {order.status === 'IN_FLIGHT' ? 'Đang giao hàng' : 
                   order.status === 'DELIVERED' ? 'Đã giao thành công' : 
                   'Chuẩn bị giao hàng'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Món Đã Đặt</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items.map((item, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg">
                  <img
                    src={item.imageUrl || '/api/placeholder/64/64'}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                        <p>Số lượng: {item.quantity}</p>
                        <p>Đơn giá: {formatCurrency(item.price)}</p>
                        {item.specialInstructions && (
                          <p className="italic">"{item.specialInstructions}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Tóm Tắt Đơn Hàng</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tạm tính</span>
            <span className="font-medium">{formatCurrency(order.amount?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phí giao hàng</span>
            <span className="font-medium">{formatCurrency(order.amount?.deliveryFee || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phí dịch vụ</span>
            <span className="font-medium">Miễn phí</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-lg">Tổng</span>
              <span className="font-bold text-lg text-primary-600">
                {formatCurrency(order.amount?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {canUpdate && nextStatus && (
          <button
            onClick={() => handleUpdateStatus(nextStatus.status)}
            disabled={updateStatusMutation.isLoading || assignDroneMutation.isLoading}
            className={`btn btn-primary flex items-center space-x-2 ${
              nextStatus.status === 'CONFIRMED' ? 'bg-green-600 hover:bg-green-700' :
              nextStatus.status === 'ASSIGN_DRONE' ? 'bg-blue-600 hover:bg-blue-700' :
              nextStatus.status === 'READY_FOR_PICKUP' ? 'bg-orange-600 hover:bg-orange-700' :
              'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {(updateStatusMutation.isLoading || assignDroneMutation.isLoading) ? (
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
                updateStatusMutation.mutate({ orderId: id, status: 'CANCELLED', note: reason })
              }
            }}
            className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            Hủy Đơn Hàng
          </button>
        )}
      </div>

      {/* Note Input */}
      {showNoteInput && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thêm Ghi Chú (Tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Thêm ghi chú về đơn hàng này..."
          />
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowNoteInput(false)}
              className="btn btn-outline"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                if (nextStatus) {
                  handleUpdateStatus(nextStatus.status)
                }
              }}
              className="btn btn-primary"
            >
              Cập Nhật
            </button>
          </div>
        </div>
      )}
      
      {/* Drone Assignment Confirmation Modal */}
      {showDroneConfirmModal && order && (
        <DroneAssignmentModal
          order={order}
          onConfirm={confirmAssignDrone}
          onCancel={() => setShowDroneConfirmModal(false)}
          isLoading={assignDroneMutation.isLoading}
        />
      )}
    </div>
  )
}

// Order Timeline Component
function OrderTimeline({ order }) {
  const statuses = [
    { status: 'PLACED', label: 'Đã Đặt', icon: CheckCircle },
    { status: 'COOKING', label: 'Đang Chuẩn Bị', icon: Loader2 },
    { status: 'IN_FLIGHT', label: 'Đang Giao', icon: Plane },
    { status: 'DELIVERED', label: 'Đã Giao', icon: CheckCircle },
  ]

  const getStatusIndex = (status) => {
    // Map all intermediate statuses to their display status
    const statusMap = {
      'PLACED': 0,
      'CONFIRMED': 1,
      'COOKING': 1,
      'READY_FOR_PICKUP': 2,
      'IN_FLIGHT': 2,
      'DELIVERED': 3,
      'CANCELLED': -1,
      'FAILED': -1
    }
    return statusMap[status] ?? 0
  }

  const currentIndex = getStatusIndex(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'FAILED'

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-6">Tiến Trình Đơn Hàng</h2>
      <div className="relative">
        <div className="absolute top-10 left-0 right-0 h-0.5 bg-gray-200" style={{ left: '10%', right: '10%' }}></div>
        <div className="flex justify-between items-start">
          {statuses.map((status, index) => {
            const isActive = index <= currentIndex && !isCancelled
            const isCurrent = index === currentIndex && !isCancelled
            const Icon = status.icon

            return (
              <div key={status.status} className="relative flex flex-col items-center flex-1">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-primary-600 shadow-lg' : 'bg-gray-200'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  } ${isCurrent && status.status === 'COOKING' ? 'animate-spin' : ''}`} />
                </div>
                <div className="mt-3 text-center max-w-[80px]">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </p>
                  {isCurrent && order.status !== 'DELIVERED' && (
                    <p className="text-xs text-primary-600 mt-1 font-medium">
                      Đang xử lý...
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isCancelled && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-medium">
              Đơn hàng đã bị hủy
            </p>
          </div>
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

export default RestaurantOrderDetail






