import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { 
  Search, Filter, Clock, MapPin, Star, Eye,
  Truck, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'

function Orders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery(
    ['orders', { search: searchQuery, status: statusFilter, sortBy }],
    () => orderService.getMyOrders({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy
    }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    }
  )

  const orders = ordersData?.data?.orders || []

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'PLACED', label: 'Đã đặt' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'COOKING', label: 'Đang nấu' },
    { value: 'READY_FOR_PICKUP', label: 'Sẵn sàng giao' },
    { value: 'IN_FLIGHT', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'total', label: 'Highest Amount' },
    { value: 'status', label: 'By Status' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">
          Track your orders and delivery status
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
              placeholder="Search orders by restaurant name or order ID..."
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
            <span>Refresh</span>
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
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Truck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No orders match your current filters.'
                : 'You haven\'t placed any orders yet.'
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
                Clear Filters
              </button>
            ) : (
              <Link to="/customer/restaurants" className="btn btn-primary">
                Browse Restaurants
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Order Card Component
function OrderCard({ order }) {
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

  const canCancel = ['PLACED', 'CONFIRMED'].includes(order.status)
  const canRate = order.status === 'DELIVERED' && !order.rating

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Restaurant Image */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
            <img
              src={order.restaurant?.imageUrl || '/api/placeholder/64/64'}
              alt={order.restaurant?.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {order.restaurant?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Order #{order.orderNumber}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {formatOrderStatus(order.status)}
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span>{order.items.length} items</span>
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
                  +{order.items.length - 3} more
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
          <Link
            to={`/customer/orders/${order._id}`}
            className="btn btn-outline btn-sm flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Xem</span>
          </Link>

          {canCancel && (
            <button
              onClick={() => handleCancelOrder(order._id)}
              className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel
            </button>
          )}

          {canRate && (
            <button
              onClick={() => handleRateOrder(order._id)}
              className="btn btn-primary btn-sm flex items-center space-x-1"
            >
              <Star className="h-4 w-4" />
              <span>Rate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
async function handleCancelOrder(orderId) {
  if (window.confirm('Are you sure you want to cancel this order?')) {
    try {
      await orderService.cancelOrder(orderId, 'Cancelled by customer')
      toast.success('Order cancelled successfully')
      // Refresh orders list
      window.location.reload()
    } catch (error) {
      toast.error('Failed to cancel order')
    }
  }
}

async function handleRateOrder(orderId) {
  const rating = window.prompt('Rate this order (1-5 stars):')
  if (rating && rating >= 1 && rating <= 5) {
    try {
      await orderService.rateOrder(orderId, { rating: parseInt(rating) })
      toast.success('Thank you for your rating!')
      // Refresh orders list
      window.location.reload()
    } catch (error) {
      toast.error('Failed to submit rating')
    }
  }
}

export default Orders

