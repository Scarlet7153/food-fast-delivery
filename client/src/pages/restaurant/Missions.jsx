import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { missionService } from '../../services/missionService'
import { 
  Search, Filter, Clock, MapPin, Star, Eye, CheckCircle,
  Truck, XCircle, AlertCircle, Package, Utensils, Loader2
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function RestaurantMissions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const queryClient = useQueryClient()

  // Fetch missions
  const { data: missionsData, isLoading, refetch } = useQuery(
    ['restaurant-missions', { search: searchQuery, status: statusFilter, sortBy }],
    () => missionService.getRestaurantMissions({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    }
  )

  // Update mission status mutation
  const updateStatusMutation = useMutation(
    ({ missionId, status, note }) => missionService.updateMissionStatus(missionId, status, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-missions'])
        toast.success('Cập nhật trạng thái đơn giao thành công')
      },
      onError: (error) => {
        toast.error('Không thể cập nhật trạng thái đơn giao')
      }
    }
  )

  // Start flight simulation mutation
  const startSimulationMutation = useMutation(
    (missionId) => missionService.startFlightSimulation(missionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-missions'])
        toast.success('Bắt đầu giả lập bay - Drone đang giao hàng!')
      },
      onError: (error) => {
        toast.error('Không thể khởi động giả lập bay')
      }
    }
  )

  // Assign drone mutation
  const assignDroneMutation = useMutation(
    ({ missionId, droneId }) => missionService.assignDroneToMission(missionId, droneId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-missions'])
        toast.success('Phân công drone thành công')
      },
      onError: (error) => {
        toast.error('Không thể phân công drone')
      }
    }
  )

  const missions = missionsData?.data?.missions || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Đơn Giao' },
    { value: 'PENDING', label: 'Chờ Xử Lý' },
    { value: 'ASSIGNED', label: 'Đã Phân Công' },
    { value: 'IN_PROGRESS', label: 'Đang Thực Hiện' },
    { value: 'COMPLETED', label: 'Hoàn Thành' },
    { value: 'CANCELLED', label: 'Đã Hủy' },
    { value: 'FAILED', label: 'Thất Bại' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Mới Nhất' },
    { value: 'oldest', label: 'Cũ Nhất' },
    { value: 'priority', label: 'Ưu Tiên' },
    { value: 'status', label: 'Theo Trạng Thái' },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const handleStatusUpdate = (missionId, newStatus, note = '') => {
    updateStatusMutation.mutate({ missionId, status: newStatus, note })
  }

  const handleAssignDrone = (missionId, droneId) => {
    assignDroneMutation.mutate({ missionId, droneId })
  }

  const handleStartSimulation = (missionId) => {
    startSimulationMutation.mutate(missionId)
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return { status: 'ASSIGNED', label: 'Phân Công Drone', icon: Truck }
      case 'ASSIGNED':
        return { status: 'IN_PROGRESS', label: 'Bắt Đầu Giao Hàng', icon: Clock }
      case 'IN_PROGRESS':
        return { status: 'COMPLETED', label: 'Hoàn Thành Giao Hàng', icon: CheckCircle }
      default:
        return null
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
              placeholder="Tìm kiếm đơn giao theo số đơn hoặc tên khách hàng..."
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
                onStatusUpdate={handleStatusUpdate}
                onAssignDrone={handleAssignDrone}
                onStartSimulation={handleStartSimulation}
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                isUpdating={updateStatusMutation.isLoading || assignDroneMutation.isLoading || startSimulationMutation.isLoading}
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
    </div>
  )
}

// Mission Card Component
function MissionCard({ mission, onStatusUpdate, onAssignDrone, onStartSimulation, getNextStatus, getStatusIcon, getStatusColor, isUpdating }) {
  const [showDroneSelect, setShowDroneSelect] = useState(false)
  const [selectedDroneId, setSelectedDroneId] = useState('')
  
  const nextStatus = getNextStatus(mission.status)
  const canUpdate = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(mission.status)
  const isInFlight = mission.status === 'IN_PROGRESS'

  const handleUpdateStatus = (newStatus) => {
    onStatusUpdate(mission._id, newStatus)
  }

  const handleAssignDrone = () => {
    if (selectedDroneId) {
      onAssignDrone(mission._id, selectedDroneId)
      setShowDroneSelect(false)
      setSelectedDroneId('')
    }
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Mission Icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {getStatusIcon(mission.status)}
          </div>

          {/* Mission Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Đơn Giao #{mission.missionNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Đơn: #{mission.order?.orderNumber}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mission.status)}`}>
                  {mission.status.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Mission Details */}
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span>{mission.order?.items?.length || 0} món</span>
                <span>•</span>
                <span>{formatCurrency(mission.order?.amount?.total || 0)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(mission.createdAt)}</span>
                </div>
              </div>
              
              {mission.route?.delivery?.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{mission.route.delivery.address}</span>
                </div>
              )}

              {mission.droneId && (
                <div className="flex items-center space-x-1">
                  <Truck className="h-3 w-3" />
                  <span>Drone: {mission.droneId.name || 'Unknown'}</span>
                </div>
              )}

              {/* Flight progress for IN_PROGRESS missions */}
              {isInFlight && mission.flightPath && mission.flightPath.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-900">
                      🚁 Đang bay - {mission.flightPath.length} điểm theo dõi
                    </span>
                    {mission.flightPath[mission.flightPath.length - 1]?.batteryPercent && (
                      <span className="text-blue-700">
                        Pin: {mission.flightPath[mission.flightPath.length - 1].batteryPercent}%
                      </span>
                    )}
                  </div>
                  {mission.estimates && (
                    <div className="mt-1 text-xs text-blue-700">
                      Khoảng cách: {mission.estimates.distanceKm?.toFixed(2)} km • 
                      Thời gian ước tính: {mission.estimates.etaMinutes} phút
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mission Progress */}
            {mission.estimatedArrival && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                <Clock className="h-3 w-3" />
                <span>ETA: {formatDateTime(mission.estimatedArrival)}</span>
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

          {/* Start simulation button for ASSIGNED missions */}
          {mission.status === 'ASSIGNED' && (
            <button
              onClick={() => onStartSimulation(mission._id)}
              disabled={isUpdating}
              className="btn btn-sm flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              <span>Giả Lập Bay</span>
            </button>
          )}

          {canUpdate && nextStatus && (
            <button
              onClick={() => handleUpdateStatus(nextStatus.status)}
              disabled={isUpdating}
              className={`btn btn-primary btn-sm flex items-center space-x-1 ${
                nextStatus.status === 'ASSIGNED' ? 'bg-green-600 hover:bg-green-700' :
                nextStatus.status === 'IN_PROGRESS' ? 'bg-yellow-600 hover:bg-yellow-700' :
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

          {mission.status === 'PENDING' && (
            <button
              onClick={() => setShowDroneSelect(true)}
              className="btn btn-outline btn-sm text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Phân Công Drone
            </button>
          )}

          {mission.status === 'PENDING' && (
            <button
              onClick={() => {
                const reason = window.prompt('Lý do hủy:')
                if (reason) {
                  onStatusUpdate(mission._id, 'CANCELLED', reason)
                }
              }}
              className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Drone Selection Modal */}
      {showDroneSelect && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-blue-900">
              Chọn Drone:
            </label>
            <select
              value={selectedDroneId}
              onChange={(e) => setSelectedDroneId(e.target.value)}
              className="input flex-1"
            >
              <option value="">Chọn drone...</option>
              {/* This would be populated with available drones */}
              <option value="drone1">Drone #1 (Sẵn sàng)</option>
              <option value="drone2">Drone #2 (Sẵn sàng)</option>
            </select>
            <button
              onClick={handleAssignDrone}
              disabled={!selectedDroneId}
              className="btn btn-primary btn-sm"
            >
              Phân Công
            </button>
            <button
              onClick={() => {
                setShowDroneSelect(false)
                setSelectedDroneId('')
              }}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantMissions