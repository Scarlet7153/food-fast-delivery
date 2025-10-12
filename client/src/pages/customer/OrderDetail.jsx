import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { orderService } from '../../services/orderService'
import socketService from '../../services/socketService'
import { 
  ArrowLeft, MapPin, Clock, Phone, Star, Truck,
  CheckCircle, XCircle, AlertCircle, Loader2
} from 'lucide-react'
import { 
  formatCurrency, formatDateTime, formatOrderStatus, 
  formatMissionStatus, formatDistance 
} from '../../utils/formatters'
import toast from 'react-hot-toast'

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [showRatingModal, setShowRatingModal] = useState(false)

  // Fetch order details
  const { data: orderData, isLoading, refetch } = useQuery(
    ['order', id],
    () => orderService.getOrder(id),
    {
      enabled: !!id,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
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
          toast.success('Order status updated!')
        }
      })

      // Listen for mission updates
      socketService.onMissionUpdate((data) => {
        if (data.orderId === order._id) {
          refetch()
          toast.success('Delivery status updated!')
        }
      })
    }

    return () => {
      socketService.removeAllListeners()
    }
  }, [order, refetch])

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await orderService.cancelOrder(id, 'Cancelled by customer')
        toast.success('Order cancelled successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to cancel order')
      }
    }
  }

  const handleRateOrder = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      await orderService.rateOrder(id, { rating })
      toast.success('Thank you for your rating!')
      setShowRatingModal(false)
      refetch()
    } catch (error) {
      toast.error('Failed to submit rating')
    }
  }

  const canCancel = order && ['PLACED', 'CONFIRMED'].includes(order.status)
  const canRate = order && order.status === 'DELIVERED' && !order.rating

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
          Order not found
        </h2>
        <p className="text-gray-600 mb-6">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <button
          onClick={() => navigate('/customer/orders')}
          className="btn btn-primary"
        >
          Back to Orders
        </button>
      </div>
    )
  }

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusIcon(order.status)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {formatOrderStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Order Status Timeline */}
      <OrderTimeline order={order} />

      {/* Restaurant Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Restaurant Information</h2>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg">
            <img
              src={order.restaurant?.imageUrl || '/api/placeholder/64/64'}
              alt={order.restaurant?.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {order.restaurant?.name}
            </h3>
            <p className="text-gray-600 mb-2">
              {order.restaurant?.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>{order.restaurant?.rating?.toFixed(1) || '4.5'}</span>
              </div>
              {order.restaurant?.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{order.restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Order Items</h2>
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
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.specialInstructions && (
                          <span className="italic">"{item.specialInstructions}"</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
        
        {order.deliveryAddress && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Delivery Address</p>
                <p className="text-gray-600">
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.city && `, ${order.deliveryAddress.city}`}
                  {order.deliveryAddress.district && `, ${order.deliveryAddress.district}`}
                  {order.deliveryAddress.ward && `, ${order.deliveryAddress.ward}`}
                </p>
                {order.deliveryAddress.notes && (
                  <p className="text-sm text-gray-500 mt-1">
                    Note: {order.deliveryAddress.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Contact Information</p>
                <p className="text-gray-600">
                  {order.contactInfo?.name} • {order.contactInfo?.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {order.specialInstructions && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Special Instructions:</strong> {order.specialInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Drone Mission */}
      {order.deliveryMission && (
        <DroneMissionCard mission={order.deliveryMission} />
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tạm tính</span>
            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phí giao hàng</span>
            <span className="font-medium">{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Fee</span>
            <span className="font-medium">Free</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-lg">Tổng</span>
              <span className="font-bold text-lg text-primary-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancel Order
          </button>
        )}

        {canRate && (
          <button
            onClick={() => setShowRatingModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Star className="h-4 w-4" />
            <span>Rate Order</span>
          </button>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          rating={rating}
          setRating={setRating}
          onSubmit={handleRateOrder}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  )
}

// Order Timeline Component
function OrderTimeline({ order }) {
  const statuses = [
    { status: 'PLACED', label: 'Order Placed', icon: CheckCircle },
    { status: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle },
    { status: 'COOKING', label: 'Đang nấu', icon: Loader2 },
    { status: 'READY_FOR_PICKUP', label: 'Sẵn sàng giao', icon: Truck },
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
      <h2 className="text-lg font-semibold mb-4">Order Progress</h2>
      <div className="relative">
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {statuses.map((status, index) => {
            const isActive = index <= currentIndex && !isCancelled
            const isCurrent = index === currentIndex && !isCancelled
            const Icon = status.icon

            return (
              <div key={status.status} className="relative flex items-start space-x-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  } ${isCurrent && status.status === 'COOKING' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </p>
                  {isCurrent && order.status !== 'DELIVERED' && (
                    <p className="text-xs text-gray-500 mt-1">
                      In progress...
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
            <span className="text-sm font-medium text-red-800">
              Order {order.status.toLowerCase()}
            </span>
          </div>
          {order.cancellationReason && (
            <p className="text-sm text-red-700 mt-1">
              Reason: {order.cancellationReason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Drone Mission Card Component
function DroneMissionCard({ mission }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'ABORTED':
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'IN_FLIGHT':
      case 'TAKEOFF':
      case 'CRUISING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
        <Truck className="h-5 w-5" />
        <span>Drone Delivery</span>
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              Drone #{mission.drone?.name}
            </p>
            <p className="text-sm text-gray-600">
              {mission.drone?.model || 'Delivery Drone'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mission.status)}`}>
            {formatMissionStatus(mission.status)}
          </span>
        </div>

        {mission.estimatedArrival && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>ETA: {formatDateTime(mission.estimatedArrival)}</span>
          </div>
        )}

        {mission.currentLocation && (
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              Current: {mission.currentLocation.lat.toFixed(4)}, {mission.currentLocation.lng.toFixed(4)}
            </span>
          </div>
        )}

        {mission.path && mission.path.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Flight Path</p>
            <div className="text-xs text-gray-600">
              <p>Total distance: {formatDistance(mission.totalDistance || 0)}</p>
              <p>Estimated flight time: {mission.estimatedFlightTime || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Rating Modal Component
function RatingModal({ rating, setRating, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Rate Your Order</h3>
        
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={rating === 0}
            className="btn btn-primary"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

