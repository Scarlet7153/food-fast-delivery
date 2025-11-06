import { useState } from 'react'
import { useQuery } from 'react-query'
import { missionService } from '../../services/missionService'
import { 
  Search, Clock, MapPin, Eye, CheckCircle,
  Truck, XCircle, AlertCircle, Plane
} from 'lucide-react'
import { formatDateTime, formatMissionStatus } from '../../utils/formatters'
import { t } from '../../utils/translations'
import DroneTrackingMap from '../../components/DroneTrackingMap'

function RestaurantMissions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMission, setSelectedMission] = useState(null)
  const [showMissionModal, setShowMissionModal] = useState(false)

  // Fetch missions
  const { data: missionsData, isLoading } = useQuery(
    ['restaurant-missions', { search: searchQuery, status: statusFilter }],
    () => missionService.getRestaurantMissions({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    }
  )

  const missions = missionsData?.data?.missions || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Đơn Giao' },
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
        return <Plane className="h-4 w-4 text-blue-500" />
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
          Quản lý đơn giao hàng bằng drone và theo dõi tiến độ
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
              placeholder="Tìm kiếm đơn giao theo số đơn hoặc drone..."
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

      {/* Missions List */}
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
        ) : missions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {missions.map((mission) => (
              <MissionCard 
                key={mission._id} 
                mission={mission} 
                onViewMission={() => handleViewMission(mission)}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Truck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn giao
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Không có đơn giao nào phù hợp với bộ lọc.'
                : 'Chưa có đơn giao hàng nào được tạo.'
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

      {/* Mission Detail Modal */}
      {showMissionModal && selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          onClose={() => {
            setShowMissionModal(false)
            setSelectedMission(null)
          }}
        />
      )}
    </div>
  )
}

// Mission Detail Modal Component
function MissionDetailModal({ mission, onClose }) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
              <p className="text-sm text-gray-600">ID: #{mission.missionNumber || mission._id?.slice(-6)}</p>
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
                Khách hàng: {mission.order?.customer?.name || 'N/A'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Thông Tin Drone</h3>
              <p className="text-sm text-gray-600">
                Drone: {mission.drone?.name || mission.droneId?.name || 'Chưa phân công'}
              </p>
              <p className="text-sm text-gray-600">
                Model: {mission.drone?.model || mission.droneId?.model || 'N/A'}
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

// Mission Card Component
function MissionCard({ mission, onViewMission, getStatusIcon, getStatusColor }) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Mission Icon */}
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {getStatusIcon(mission.status)}
          </div>

          {/* Mission Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Đơn Giao #{mission.missionNumber || mission._id?.slice(-6)}
                </h3>
                <p className="text-sm text-gray-600">
                  Đơn hàng: #{mission.order?.orderNumber || 'N/A'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)} ml-4`}>
                {formatMissionStatus(mission.status)}
              </span>
            </div>

            {/* Mission Details */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-4 flex-wrap">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(mission.createdAt)}</span>
                </div>
                {mission.drone && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Plane className="h-3 w-3" />
                      <span>Drone: {mission.drone.name || mission.drone._id?.slice(-6)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {mission.route?.delivery?.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{mission.route.delivery.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          <button 
            onClick={onViewMission}
            className="btn btn-outline btn-sm flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Xem</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantMissions