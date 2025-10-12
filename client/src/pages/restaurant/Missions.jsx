import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { missionService } from '../../services/missionService'
import { 
  Search, Filter, Clock, MapPin, Star, Eye, CheckCircle,
  Truck, XCircle, AlertCircle, Package, Utensils, Loader2
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../utils/formatters'
import toast from 'react-hot-toast'

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
        toast.success('Mission status updated successfully')
      },
      onError: (error) => {
        toast.error('Failed to update mission status')
      }
    }
  )

  // Assign drone mutation
  const assignDroneMutation = useMutation(
    ({ missionId, droneId }) => missionService.assignDroneToMission(missionId, droneId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-missions'])
        toast.success('Drone assigned successfully')
      },
      onError: (error) => {
        toast.error('Failed to assign drone')
      }
    }
  )

  const missions = missionsData?.data?.missions || []

  const statusOptions = [
    { value: 'all', label: 'All Missions' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'FAILED', label: 'Failed' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'By Status' },
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

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return { status: 'ASSIGNED', label: 'Assign Drone', icon: Truck }
      case 'ASSIGNED':
        return { status: 'IN_PROGRESS', label: 'Start Mission', icon: Clock }
      case 'IN_PROGRESS':
        return { status: 'COMPLETED', label: 'Complete Mission', icon: CheckCircle }
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Missions</h1>
        <p className="text-gray-600 mt-1">
          Manage drone delivery missions and track their progress
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
              placeholder="Search missions by order number or customer name..."
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
                getNextStatus={getNextStatus}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                isUpdating={updateStatusMutation.isLoading || assignDroneMutation.isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Truck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No missions found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No missions match your current filters.'
                : 'No delivery missions have been created yet.'
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
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

// Mission Card Component
function MissionCard({ mission, onStatusUpdate, onAssignDrone, getNextStatus, getStatusIcon, getStatusColor, isUpdating }) {
  const [showDroneSelect, setShowDroneSelect] = useState(false)
  const [selectedDroneId, setSelectedDroneId] = useState('')
  
  const nextStatus = getNextStatus(mission.status)
  const canUpdate = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(mission.status)

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
                  Mission #{mission.missionNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Order: #{mission.order?.orderNumber}
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
                <span>{mission.order?.items?.length || 0} items</span>
                <span>•</span>
                <span>{formatCurrency(mission.order?.totalAmount || 0)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(mission.createdAt)}</span>
                </div>
              </div>
              
              {mission.deliveryAddress && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{mission.deliveryAddress.street}</span>
                </div>
              )}

              {mission.assignedDrone && (
                <div className="flex items-center space-x-1">
                  <Truck className="h-3 w-3" />
                  <span>Drone: {mission.assignedDrone.name}</span>
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
            <span>View</span>
          </button>

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
              Assign Drone
            </button>
          )}

          {mission.status === 'PENDING' && (
            <button
              onClick={() => {
                const reason = window.prompt('Cancellation reason:')
                if (reason) {
                  onStatusUpdate(mission._id, 'CANCELLED', reason)
                }
              }}
              className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Drone Selection Modal */}
      {showDroneSelect && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-blue-900">
              Select Drone:
            </label>
            <select
              value={selectedDroneId}
              onChange={(e) => setSelectedDroneId(e.target.value)}
              className="input flex-1"
            >
              <option value="">Choose a drone...</option>
              {/* This would be populated with available drones */}
              <option value="drone1">Drone #1 (Available)</option>
              <option value="drone2">Drone #2 (Available)</option>
            </select>
            <button
              onClick={handleAssignDrone}
              disabled={!selectedDroneId}
              className="btn btn-primary btn-sm"
            >
              Assign
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