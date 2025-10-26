import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'
import { 
  Search, Filter, Truck, MapPin, Activity, 
  CheckCircle, XCircle, AlertTriangle, Eye, Settings, Battery
} from 'lucide-react'
import { formatDateTime, formatDroneStatus, formatWeight, formatDistance } from '../../utils/formatters'
import { t } from '../../utils/translations'

function AdminDrones() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [selectedDrone, setSelectedDrone] = useState(null)
  const [showDroneModal, setShowDroneModal] = useState(false)

  // Fetch drones
  const { data: dronesData, isLoading } = useQuery(
    ['admin-drones', { search: searchQuery, status: statusFilter, restaurant: restaurantFilter }],
    () => adminService.getAllDrones({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      restaurant: restaurantFilter !== 'all' ? restaurantFilter : undefined
    }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const drones = dronesData?.data?.drones || []
  const restaurants = dronesData?.data?.restaurants || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Trạng Thái' },
    { value: 'IDLE', label: 'Rảnh Rỗi' },
    { value: 'CHARGING', label: 'Đang Sạc' },
    { value: 'MAINTENANCE', label: 'Bảo Trì' },
    { value: 'IN_FLIGHT', label: 'Đang giao' },
    { value: 'ERROR', label: 'Lỗi' },
  ]

  const handleViewDrone = (drone) => {
    setSelectedDrone(drone)
    setShowDroneModal(true)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'IDLE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CHARGING':
        return <Battery className="h-4 w-4 text-blue-500" />
      case 'MAINTENANCE':
        return <Settings className="h-4 w-4 text-yellow-500" />
      case 'IN_FLIGHT':
        return <Activity className="h-4 w-4 text-purple-500" />
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'IDLE':
        return 'bg-green-100 text-green-800'
      case 'CHARGING':
        return 'bg-blue-100 text-blue-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_FLIGHT':
        return 'bg-purple-100 text-purple-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Drone</h1>
        <p className="text-gray-600 mt-1">
          Theo dõi và quản lý tất cả drone trên nền tảng
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
              placeholder="Tìm kiếm drone theo tên, model hoặc số serial..."
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

      {/* Drones Grid */}
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
        ) : drones.length > 0 ? (
          drones.map((drone) => (
            <DroneCard
              key={drone._id}
              drone={drone}
              onView={handleViewDrone}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy drone
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || restaurantFilter !== 'all'
                  ? 'Không có drone nào phù hợp với bộ lọc.'
                  : 'Chưa có drone nào được đăng ký.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drone Detail Modal */}
      {showDroneModal && selectedDrone && (
        <DroneDetailModal
          drone={selectedDrone}
          onClose={() => setShowDroneModal(false)}
        />
      )}
    </div>
  )
}

// Drone Card Component
function DroneCard({ drone, onView, getStatusIcon, getStatusColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{drone.name}</h3>
          <p className="text-sm text-gray-600">{drone.model}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(drone.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(drone.status)}`}>
            {formatDroneStatus(drone.status)}
          </span>
        </div>
      </div>

      {/* Drone Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Nhà hàng</span>
          <span className="font-medium text-gray-900">{drone.restaurant?.name}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tải Trọng Tối Đa</span>
          <span className="font-medium">{formatWeight(drone.maxPayloadGrams)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tầm Bay Tối Đa</span>
          <span className="font-medium">{formatDistance(drone.maxRangeMeters)}</span>
        </div>
      </div>

      {/* Current Mission */}
      {drone.currentMission && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Đơn Giao Đang Thực Hiện</span>
          </div>
          <p className="text-sm text-blue-700">
            Order #{drone.currentMission.orderId?.orderNumber || 'N/A'}
          </p>
        </div>
      )}

      {/* Location */}
      {drone.currentLocation && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <MapPin className="h-4 w-4" />
          <span className="text-xs">
            {drone.currentLocation.lat.toFixed(4)}, {drone.currentLocation.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Cập nhật lần cuối: {formatDateTime(drone.lastUpdatedAt)}
        </div>
        <button
          onClick={() => onView(drone)}
          className="btn btn-outline btn-sm flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>Xem</span>
        </button>
      </div>
    </div>
  )
}

// Drone Detail Modal Component
function DroneDetailModal({ drone: initialDrone, onClose }) {
  const [drone, setDrone] = useState(initialDrone)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch full drone details with recent missions
  useEffect(() => {
    const fetchDroneDetails = async () => {
      try {
        setIsLoading(true)
        const response = await adminService.getDroneById(initialDrone._id)
        setDrone(response.data.drone)
      } catch (error) {
        console.error('Error fetching drone details:', error)
        toast.error('Failed to load drone details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDroneDetails()
  }, [initialDrone._id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chi Tiết Drone</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Drone Header */}
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <Truck className="h-12 w-12 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{drone.name}</h3>
              <p className="text-gray-600 mb-2">{drone.model}</p>
              <p className="text-sm text-gray-500">Serial: {drone.serialNumber}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-4">Thông Số Kỹ Thuật Drone</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tải Trọng Tối Đa</span>
                  <span className="font-medium">{formatWeight(drone.maxPayloadGrams)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tầm Bay Tối Đa</span>
                  <span className="font-medium">{formatDistance(drone.maxRangeMeters)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Thời Gian Bay Tối Đa</span>
                  <span className="font-medium">{drone.maxFlightTimeMinutes} phút</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">Thông Tin Trạng Thái</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng Thái Hiện Tại</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formatDroneStatus(drone.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nhà hàng</span>
                  <span className="font-medium">{drone.restaurant?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ngày Đăng Ký</span>
                  <span className="font-medium">{formatDateTime(drone.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cập Nhật Lần Cuối</span>
                  <span className="font-medium">{formatDateTime(drone.lastUpdatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Location */}
          {drone.currentLocation && (
            <div>
              <h4 className="text-lg font-medium mb-4">Vị Trí Hiện Tại</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900">
                      Vĩ độ: {drone.currentLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-gray-900">
                      Kinh độ: {drone.currentLocation.lng.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cập nhật lần cuối: {formatDateTime(drone.currentLocation.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Mission */}
          {drone.currentMission && (
            <div>
              <h4 className="text-lg font-medium mb-4">Đơn Giao Hiện Tại</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Đơn Giao
                    </label>
                    <p className="text-gray-900">#{drone.currentMission.missionNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Đơn Hàng
                    </label>
                    <p className="text-gray-900">#{drone.currentMission.orderId?.orderNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng Thái Đơn Giao
                    </label>
                    <p className="text-gray-900">{drone.currentMission.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bắt Đầu Lúc
                    </label>
                    <p className="text-gray-900">{formatDateTime(drone.currentMission.startedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mission History */}
          <div>
            <h4 className="text-lg font-medium mb-4">Đơn Giao Gần Đây</h4>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {drone.recentMissions?.length > 0 ? (
                  drone.recentMissions.map((mission) => (
                    <div key={mission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Đơn giao #{mission._id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">
                          Order #{mission.orderId?.orderNumber || 'N/A'} • {formatDateTime(mission.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        mission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mission.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không có đơn giao gần đây</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {drone.notes && (
            <div>
              <h4 className="text-lg font-medium mb-4">Ghi Chú</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">{drone.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDrones
