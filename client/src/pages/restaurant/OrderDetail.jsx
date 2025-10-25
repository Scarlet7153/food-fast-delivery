import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { orderService } from '../../services/orderService'
import socketService from '../../services/socketService'
import { 
  ArrowLeft, MapPin, Clock, Phone, Star, Truck,
  CheckCircle, XCircle, AlertCircle, Loader2, Package, Utensils
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
      'CONFIRMED': { status: 'COOKING', label: 'Bắt Đầu Nấu', icon: Utensils },
      'COOKING': { status: 'READY_FOR_PICKUP', label: 'Sẵn Sàng Giao', icon: Package },
      'READY_FOR_PICKUP': { status: 'IN_FLIGHT', label: 'Đang Giao', icon: Truck }
    }
    return statusFlow[currentStatus]
  }

  const handleUpdateStatus = (newStatus) => {
    if (showNoteInput) {
      updateStatusMutation.mutate({ orderId: id, status: newStatus, note })
    } else {
      updateStatusMutation.mutate({ orderId: id, status: newStatus })
    }
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
            disabled={updateStatusMutation.isLoading}
            className={`btn btn-primary flex items-center space-x-2 ${
              nextStatus.status === 'CONFIRMED' ? 'bg-green-600 hover:bg-green-700' :
              nextStatus.status === 'COOKING' ? 'bg-yellow-600 hover:bg-yellow-700' :
              nextStatus.status === 'READY_FOR_PICKUP' ? 'bg-orange-600 hover:bg-orange-700' :
              'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {updateStatusMutation.isLoading ? (
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
    </div>
  )
}

// Order Timeline Component
function OrderTimeline({ order }) {
  const statuses = [
    { status: 'PLACED', label: 'Đã Đặt', icon: CheckCircle },
    { status: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle },
    { status: 'COOKING', label: 'Đang nấu', icon: Loader2 },
    { status: 'READY_FOR_PICKUP', label: 'Sẵn sàng giao', icon: Package },
    { status: 'IN_FLIGHT', label: 'Đang giao', icon: Truck },
    { status: 'DELIVERED', label: 'Đã giao', icon: CheckCircle },
  ]

  const getStatusIndex = (status) => {
    return statuses.findIndex(s => s.status === status)
  }

  const currentIndex = getStatusIndex(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'FAILED'

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Tiến Trình Đơn Hàng</h2>
      <div className="relative">
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200"></div>
        <div className="flex justify-between">
          {statuses.map((status, index) => {
            const isActive = index <= currentIndex && !isCancelled
            const isCurrent = index === currentIndex && !isCancelled
            const Icon = status.icon

            return (
              <div key={status.status} className="relative flex flex-col items-center">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  } ${isCurrent && status.status === 'COOKING' ? 'animate-spin' : ''}`} />
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </p>
                  {isCurrent && order.status !== 'DELIVERED' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Đang thực hiện...
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

export default RestaurantOrderDetail



