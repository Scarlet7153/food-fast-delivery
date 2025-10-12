import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminService } from '../../services/adminService'
import { 
  Search, Filter, Building2, MapPin, Phone, Mail, 
  CheckCircle, XCircle, AlertTriangle, Eye, Edit3,
  Star, Clock, DollarSign
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function AdminRestaurants() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)

  const queryClient = useQueryClient()

  // Fetch restaurants
  const { data: restaurantsData, isLoading } = useQuery(
    ['admin-restaurants', { search: searchQuery, status: statusFilter }],
    () => adminService.getRestaurants({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Update restaurant status mutation
  const updateRestaurantMutation = useMutation(
    ({ restaurantId, action, reason }) => adminService.updateRestaurantStatus(restaurantId, action, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-restaurants'])
        toast.success('Cập nhật trạng thái nhà hàng thành công')
        setShowRestaurantModal(false)
      },
      onError: (error) => {
        toast.error('Không thể cập nhật trạng thái nhà hàng')
      }
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Trạng Thái' },
    { value: 'pending', label: 'Chờ Duyệt' },
    { value: 'approved', label: 'Đã Duyệt' },
    { value: 'rejected', label: 'Từ Chối' },
    { value: 'suspended', label: 'Bị Khóa' },
  ]

  const handleViewRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setShowRestaurantModal(true)
  }

  const handleUpdateRestaurantStatus = async (restaurantId, action, reason) => {
    await updateRestaurantMutation.mutateAsync({ restaurantId, action, reason })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Nhà Hàng</h1>
        <p className="text-gray-600 mt-1">
          Quản lý đăng ký và duyệt nhà hàng
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
              placeholder="Tìm kiếm nhà hàng theo tên, chủ sở hữu hoặc ID..."
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
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : restaurants.length > 0 ? (
          restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant._id}
              restaurant={restaurant}
              onView={handleViewRestaurant}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy nhà hàng
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Không có nhà hàng nào phù hợp với bộ lọc.'
                  : 'Chưa có nhà hàng nào được đăng ký.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Restaurant Detail Modal */}
      {showRestaurantModal && selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          onClose={() => setShowRestaurantModal(false)}
          onUpdateStatus={handleUpdateRestaurantStatus}
        />
      )}
    </div>
  )
}

// Restaurant Card Component
function RestaurantCard({ restaurant, onView, getStatusIcon, getStatusColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{restaurant.description}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {getStatusIcon(restaurant.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(restaurant.status)}`}>
            {restaurant.status}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{restaurant.address?.street}</span>
        </div>
        
        {restaurant.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{restaurant.phone}</span>
          </div>
        )}

        {restaurant.owner && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{restaurant.owner.email}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{restaurant.menuItemsCount || 0}</p>
          <p className="text-xs text-gray-500">Món ăn</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{restaurant.dronesCount || 0}</p>
          <p className="text-xs text-gray-500">Drone</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{restaurant.totalOrders || 0}</p>
          <p className="text-xs text-gray-500">Đơn Hàng</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Tham gia: {formatDateTime(restaurant.createdAt)}
        </div>
        <button
          onClick={() => onView(restaurant)}
          className="btn btn-outline btn-sm flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>Xem</span>
        </button>
      </div>
    </div>
  )
}

// Restaurant Detail Modal Component
function RestaurantDetailModal({ restaurant, onClose, onUpdateStatus }) {
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!action) return

    setIsUpdating(true)
    try {
      await onUpdateStatus(restaurant._id, action, reason)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chi Tiết Nhà Hàng</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Restaurant Header */}
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-lg">
              <img
                src={restaurant.imageUrl || '/api/placeholder/96/96'}
                alt={restaurant.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{restaurant.name}</h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(restaurant.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(restaurant.status)}`}>
                    {restaurant.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
              
              {/* Rating */}
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                <span className="text-gray-500">({restaurant.reviewCount || 0} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Restaurant Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-4">Thông Tin Liên Hệ</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{restaurant.phone || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{restaurant.email || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{restaurant.address?.street}</p>
                    <p className="text-sm text-gray-600">
                      {restaurant.address?.city}, {restaurant.address?.district}, {restaurant.address?.ward}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">Thông Tin Kinh Doanh</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ngày Đăng Ký</span>
                  <span className="text-gray-900">{formatDateTime(restaurant.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giấy Phép Kinh Doanh</span>
                  <span className="text-gray-900">{restaurant.businessLicense || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mã Số Thuế</span>
                  <span className="text-gray-900">{restaurant.taxId || 'Chưa cung cấp'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          {restaurant.owner && (
            <div>
              <h4 className="text-lg font-medium mb-4">Thông Tin Chủ Sở Hữu</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên Chủ Sở Hữu
                    </label>
                    <p className="text-gray-900">{restaurant.owner.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{restaurant.owner.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Điện Thoại
                    </label>
                    <p className="text-gray-900">{restaurant.owner.phone || 'Chưa cung cấp'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng Thái Tài Khoản
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      restaurant.owner.status === 'active' ? 'bg-green-100 text-green-800' :
                      restaurant.owner.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.owner.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div>
            <h4 className="text-lg font-medium mb-4">Thống Kê Nhà Hàng</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{restaurant.menuItemsCount || 0}</p>
                <p className="text-sm text-gray-600">Món ăn</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{restaurant.dronesCount || 0}</p>
                <p className="text-sm text-gray-600">Drone</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{restaurant.totalOrders || 0}</p>
                <p className="text-sm text-gray-600">Tổng Đơn Hàng</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(restaurant.totalRevenue || 0)}
                </p>
                <p className="text-sm text-gray-600">Tổng Doanh Thu</p>
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          {restaurant.deliverySettings && (
            <div>
              <h4 className="text-lg font-medium mb-4">Cài Đặt Giao Hàng</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phí Cơ Bản
                    </label>
                    <p className="text-gray-900">{formatCurrency(restaurant.deliverySettings.baseRate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khoảng Cách Tối Đa
                    </label>
                    <p className="text-gray-900">{restaurant.deliverySettings.maxDeliveryDistance}m</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời Gian Dự Kiến
                    </label>
                    <p className="text-gray-900">{restaurant.deliverySettings.estimatedTime} phút</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Management */}
          {restaurant.status === 'pending' && (
            <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium mb-4">Duyệt Nhà Hàng</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hành Động
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Chọn hành động</option>
                    <option value="approve">Duyệt Nhà Hàng</option>
                    <option value="reject">Từ Chối Đơn Đăng Ký</option>
                    <option value="request_info">Yêu Cầu Thêm Thông Tin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý Do / Ghi Chú
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input w-full"
                    rows={4}
                    placeholder="Nhập lý do duyệt/từ chối hoặc thông tin bổ sung cần thiết..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline"
                    disabled={isUpdating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating || !action}
                  >
                    {isUpdating ? 'Đang xử lý...' : 'Gửi Quyết Định'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminRestaurants
