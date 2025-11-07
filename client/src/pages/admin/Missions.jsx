import { useState } from 'react'
import { useQuery } from 'react-query'
import { adminService } from '../../services/adminService'
import Pagination from '../../components/common/Pagination'
import { 
  Search, Filter, MapPin, Clock, Truck, ShoppingBag, 
  CheckCircle, XCircle, AlertTriangle, Eye
} from 'lucide-react'
import { formatDateTime, formatMissionStatus, formatDistance, formatWeight } from '../../utils/formatters'
import { t } from '../../utils/translations'
import DroneTrackingMap from '../../components/DroneTrackingMap'

function AdminMissions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [selectedMission, setSelectedMission] = useState(null)
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Fetch missions
  const { data: missionsData, isLoading } = useQuery(
    ['admin-missions', { search: searchQuery, status: statusFilter, restaurant: restaurantFilter, page: currentPage }],
    () => adminService.getAllMissions({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      restaurantId: restaurantFilter !== 'all' ? restaurantFilter : undefined,
      page: currentPage,
      limit: pageSize
    }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const missions = missionsData?.data?.missions || []
  const restaurants = missionsData?.data?.restaurants || []
  const totalMissions = missionsData?.data?.pagination?.total || missionsData?.data?.total || 0
  const totalPages = Math.ceil(totalMissions / pageSize)

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Trạng Thái' },
    { value: 'IN_FLIGHT', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
  ]

  const handleViewMission = (mission) => {
    setSelectedMission(mission)
    setShowMissionModal(true)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'RETURNING':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
      case 'CANCELLED':
      case 'ABORTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        // PENDING, ASSIGNED, QUEUED, PREPARING, TAKEOFF, CRUISING, IN_FLIGHT, APPROACHING, LANDING
        return <Truck className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'RETURNING':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
      case 'CANCELLED':
      case 'ABORTED':
        return 'bg-red-100 text-red-800'
      default:
        // PENDING, ASSIGNED, QUEUED, PREPARING, TAKEOFF, CRUISING, IN_FLIGHT, APPROACHING, LANDING
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Giao Hàng</h1>
        <p className="text-gray-600 mt-1">
          Theo dõi tất cả đơn giao hàng trên nền tảng
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
              placeholder="Tìm kiếm đơn giao theo ID, số đơn hàng hoặc drone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
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
            onChange={(e) => {
              setRestaurantFilter(e.target.value)
              setCurrentPage(1)
            }}
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

      {/* Missions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn Giao
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bắt Đầu
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
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : missions.length > 0 ? (
                missions.map((mission) => (
                  <tr key={mission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{mission.missionNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        #{mission.order?.orderNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {mission.restaurant?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {mission.droneId?.name || 'Chưa phân công'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(mission.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                          {formatMissionStatus(mission.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mission.createdAt ? formatDateTime(mission.createdAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewMission(mission)}
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
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không tìm thấy đơn giao
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all' || restaurantFilter !== 'all'
                        ? 'Không có đơn giao nào phù hợp với bộ lọc.'
                        : 'Chưa có đơn giao hàng nào được tạo.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalMissions}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Mission Detail Modal */}
      {showMissionModal && selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          onClose={() => setShowMissionModal(false)}
        />
      )}
    </div>
  )
}

// Mission Detail Modal Component
function MissionDetailModal({ mission, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Đơn Giao #{mission.missionNumber}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Mission Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Chi Tiết Đơn Giao</h3>
              <p className="text-sm text-gray-600">ID: #{mission.missionNumber}</p>
              <p className="text-sm text-gray-600">Trạng thái: {formatMissionStatus(mission.status)}</p>
              <p className="text-sm text-gray-600">
                Tạo lúc: {formatDateTime(mission.createdAt)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Thông Tin Đơn Hàng</h3>
              <p className="text-sm text-gray-600">
                Đơn hàng: #{mission.order?.orderNumber || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Nhà hàng: {mission.restaurant?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Khách hàng: {mission.order?.customer?.name || 'N/A'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Thông Tin Drone</h3>
              <p className="text-sm text-gray-600">
                Drone: {mission.droneId?.name || 'Chưa phân công'}
              </p>
              <p className="text-sm text-gray-600">
                Model: {mission.droneId?.model || 'N/A'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          {mission.order?.items && mission.order.items.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Chi Tiết Món Ăn</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Món Ăn
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Số Lượng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Đơn Giá
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Thành Tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mission.order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {item.price?.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {(item.price * item.quantity)?.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Tổng Cộng:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {(mission.order.totalAmount || mission.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))?.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drone Tracking Map - Only show when in progress */}
          {(mission.status === 'IN_FLIGHT' || mission.status === 'ASSIGNED' || mission.status === 'PENDING') && (
            <div>
              <h3 className="text-lg font-medium mb-4">Theo Dõi Drone</h3>
              <DroneTrackingMap mission={mission} />
            </div>
          )}

          {/* Mission Timeline */}
          <div>
            <h3 className="text-lg font-medium mb-4">Lịch Sử Đơn Giao</h3>
            <div className="space-y-3">
              {/* Always show: Created */}
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Đang Giao</p>
                  <p className="text-xs text-gray-500">{formatDateTime(mission.createdAt)}</p>
                </div>
              </div>
              
              {/* Show completion based on status */}
              {(mission.status === 'DELIVERED' || mission.status === 'COMPLETED' || mission.status === 'RETURNING') && (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hoàn Thành</p>
                    <p className="text-xs text-gray-500">{formatDateTime(mission.updatedAt)}</p>
                  </div>
                </div>
              )}
              
              {(mission.status === 'FAILED' || mission.status === 'ABORTED') && (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Thất Bại</p>
                    <p className="text-xs text-gray-500">{formatDateTime(mission.updatedAt)}</p>
                  </div>
                </div>
              )}
              
              {mission.status === 'CANCELLED' && (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Đã Hủy</p>
                    <p className="text-xs text-gray-500">{formatDateTime(mission.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn btn-secondary w-full"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminMissions
