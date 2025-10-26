import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { droneService } from '../../services/droneService'
import { 
  Plus, Edit, Trash2, Power, MapPin, Clock,
  AlertTriangle, CheckCircle, XCircle, Settings, Eye, Package, X, Save, Battery, Plane
} from 'lucide-react'
import { formatDistance, formatDuration, formatDroneStatus, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function RestaurantDrones() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDrone, setEditingDrone] = useState(null)
  const queryClient = useQueryClient()

  // Fetch drones
  const { data: dronesData, isLoading, refetch } = useQuery(
    ['restaurant-drones', { search: searchQuery, status: statusFilter }],
    () => droneService.getRestaurantDrones({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    }
  )

  // Create drone mutation
  const createDroneMutation = useMutation(
    (droneData) => droneService.createDrone(droneData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-drones'])
        setShowAddModal(false)
        toast.success('Đăng ký drone thành công')
      },
      onError: (error) => {
        console.error('Create drone error:', error.response?.data)
        const errorMessage = error.response?.data?.error || 'Không thể đăng ký drone'
        toast.error(errorMessage)
      }
    }
  )

  // Update drone mutation
  const updateDroneMutation = useMutation(
    ({ droneId, droneData }) => droneService.updateDrone(droneId, droneData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-drones'])
        setEditingDrone(null)
        toast.success('Cập nhật drone thành công')
      },
      onError: (error) => {
        toast.error('Không thể cập nhật drone')
      }
    }
  )

  // Update drone status mutation
  const updateStatusMutation = useMutation(
    ({ droneId, status }) => droneService.updateDroneStatus(droneId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-drones'])
        toast.success('Cập nhật trạng thái thành công')
      },
      onError: (error) => {
        console.error('Update status error:', error)
        toast.error(error.response?.data?.error || 'Không thể cập nhật trạng thái')
      }
    }
  )

  // Delete drone mutation
  const deleteDroneMutation = useMutation(
    (droneId) => droneService.deleteDrone(droneId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-drones'])
        toast.success('Xóa drone thành công')
      },
      onError: (error) => {
        toast.error('Không thể xóa drone')
      }
    }
  )

  const drones = dronesData?.data?.drones || []

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Drone' },
    { value: 'IDLE', label: 'Rảnh' },
    { value: 'BUSY', label: 'Bận' },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'IDLE':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'BUSY':
        return <Power className="h-5 w-5 text-orange-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'IDLE':
        return 'bg-green-100 text-green-800'
      case 'BUSY':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  const handleDeleteDrone = (droneId, droneName) => {
    if (window.confirm(`Bạn có chắc muốn xóa drone "${droneName}"?`)) {
      deleteDroneMutation.mutate(droneId)
    }
  }

  const handleStatusChange = (droneId, newStatus) => {
    updateStatusMutation.mutate({
      droneId,
      status: newStatus
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Drone</h1>
          <p className="text-gray-600 mt-1">
            Quản lý drone giao hàng và theo dõi trạng thái
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Đăng Ký Drone</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm drone theo tên hoặc ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Eye className="h-5 w-5 text-gray-400" />
            </div>
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

      {/* Drones Grid */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : drones.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drones.map((drone) => (
                <DroneCard
                  key={drone._id}
                  drone={drone}
                  onEdit={() => setEditingDrone(drone)}
                  onDelete={() => handleDeleteDrone(drone._id, drone.name)}
                  onStatusChange={handleStatusChange}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  isDeleting={deleteDroneMutation.isLoading}
                  isUpdating={updateStatusMutation.isLoading}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Power className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy drone
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Không có drone nào phù hợp với bộ lọc.'
                : 'Đăng ký drone giao hàng đầu tiên để bắt đầu.'
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
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Đăng Ký Drone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingDrone) && (
        <DroneModal
          drone={editingDrone}
          onClose={() => {
            setShowAddModal(false)
            setEditingDrone(null)
          }}
          onSubmit={(data) => {
            if (editingDrone) {
              updateDroneMutation.mutate({
                droneId: editingDrone._id,
                droneData: data
              })
            } else {
              createDroneMutation.mutate(data)
            }
          }}
          isLoading={createDroneMutation.isLoading || updateDroneMutation.isLoading}
        />
      )}
    </div>
  )
}

// Drone Card Component
function DroneCard({ drone, onEdit, onDelete, onStatusChange, getStatusIcon, getStatusColor, isDeleting, isUpdating }) {
  const canChangeStatus = true

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Drone Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Plane className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{drone.name}</h3>
              <p className="text-sm text-gray-600">{drone.model}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(drone.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(drone.status)}`}>
              {drone.status === 'IDLE' ? 'Rảnh' : 'Bận'}
            </span>
            {drone.status === 'BUSY' && drone.currentMission && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Đang giao hàng
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drone Details */}
      <div className="p-4 space-y-4">

        {/* Payload */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Tải Trọng Tối Đa</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {drone.maxPayloadGrams}g
          </span>
        </div>

        {/* Range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Tầm Bay</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatDistance(drone.maxRangeMeters)}
          </span>
        </div>

        {/* Current Mission */}
        {drone.currentMission && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Đơn Giao Đang Thực Hiện</span>
              <span className="text-xs text-blue-700">
                #{drone.currentMission.orderNumber}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              ETA: {formatDateTime(drone.currentMission.estimatedArrival)}
            </p>
          </div>
        )}

        {/* Location */}
        {drone.location && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Vị Trí</span>
            </div>
            <span className="text-xs text-gray-500">
              {drone.location.lat.toFixed(4)}, {drone.location.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Status Change */}
          {canChangeStatus && (
            <select
              value={drone.status}
              onChange={(e) => onStatusChange(drone._id, e.target.value)}
              disabled={isUpdating}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="IDLE">Rảnh</option>
              <option value="BUSY">Bận</option>
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

// Drone Modal Component
function DroneModal({ drone, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: drone?.name || '',
    model: drone?.model || '',
    maxPayloadGrams: drone?.maxPayloadGrams || 1000,
    maxRangeMeters: drone?.maxRangeMeters || 5000,
    status: drone?.status || 'IDLE'
  })

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Remove status field when creating new drone (not editing)
    const submitData = { ...formData }
    if (!drone) {
      delete submitData.status
    }
    
    onSubmit(submitData)
  }

  const statusOptions = [
    { value: 'IDLE', label: 'Rảnh' },
    { value: 'BUSY', label: 'Bận' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {drone ? 'Sửa Drone' : 'Đăng Ký Drone Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên Drone *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mẫu *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tải Trọng Tối Đa (gram) *
              </label>
              <input
                type="number"
                value={formData.maxPayloadGrams}
                onChange={(e) => handleChange('maxPayloadGrams', parseInt(e.target.value))}
                className="input w-full"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tầm Bay Tối Đa (mét) *
              </label>
              <input
                type="number"
                value={formData.maxRangeMeters}
                onChange={(e) => handleChange('maxRangeMeters', parseInt(e.target.value))}
                className="input w-full"
                required
                min="1"
              />
            </div>


            {drone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng Thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="input w-full"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-md"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {drone ? 'Đang cập nhật...' : 'Đang đăng ký...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {drone ? 'Cập Nhật Drone' : 'Đăng Ký Drone'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RestaurantDrones
