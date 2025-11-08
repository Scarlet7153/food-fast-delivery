import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminService } from '../../services/adminService'
import Pagination from '../../components/common/Pagination'
import { 
  Search, Filter, Users, Mail, Phone, Calendar, 
  Shield, CheckCircle, XCircle, AlertTriangle, Eye, Edit3
} from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const queryClient = useQueryClient()

  // Fetch users
  const { data: usersData, isLoading } = useQuery(
    ['admin-users', { search: searchQuery, role: roleFilter, status: statusFilter, page: currentPage }],
    () => adminService.getUsers({
      search: searchQuery,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: currentPage,
      limit: pageSize
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Update user status mutation
  const updateUserMutation = useMutation(
    ({ userId, action, reason }) => adminService.updateUserStatus(userId, action, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users'])
        toast.success('Cập nhật trạng thái người dùng thành công')
        setShowUserModal(false)
      },
      onError: (error) => {
        toast.error('Không thể cập nhật trạng thái người dùng')
      }
    }
  )

  const users = usersData?.data?.users || []
  const totalUsers = usersData?.data?.pagination?.total || usersData?.data?.total || 0
  const totalPages = Math.ceil(totalUsers / pageSize)

  const roleOptions = [
    { value: 'all', label: 'Tất Cả Vai Trò' },
    { value: 'customer', label: 'Khách Hàng' },
    { value: 'restaurant', label: 'Nhà Hàng' },
    { value: 'admin', label: 'Quản Trị Viên' },
  ]

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Trạng Thái' },
    { value: 'active', label: 'Hoạt Động' },
    { value: 'suspended', label: 'Bị Khóa' },
  ]

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleUpdateUserStatus = async (userId, action, reason) => {
    await updateUserMutation.mutateAsync({ userId, action, reason })
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'restaurant':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'customer':
        return <Users className="h-4 w-4 text-green-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'restaurant':
        return 'bg-blue-100 text-blue-800'
      case 'customer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Hoạt Động'
      case 'suspended':
        return 'Bị Khóa'
      default:
        return status
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Quản Trị Viên'
      case 'restaurant':
        return 'Nhà Hàng'
      case 'customer':
        return 'Khách Hàng'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
        <p className="text-gray-600 mt-1">
          Quản lý người dùng nền tảng và quyền truy cập
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
              placeholder="Tìm kiếm người dùng theo tên, email hoặc ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="input pl-10 w-full"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="input lg:w-48"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người Dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai Trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tham Gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoạt Động Cuối
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-gray-400">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : 'Chưa bao giờ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không tìm thấy người dùng
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Không có người dùng nào phù hợp với bộ lọc.'
                        : 'Chưa có người dùng nào được đăng ký.'
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
          totalItems={totalUsers}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onUpdateStatus={handleUpdateUserStatus}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          getRoleColor={getRoleColor}
          getRoleLabel={getRoleLabel}
        />
      )}
    </div>
  )
}

// User Detail Modal Component
function UserDetailModal({ user, onClose, onUpdateStatus, getStatusIcon, getStatusColor, getStatusLabel, getRoleColor, getRoleLabel }) {
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!action) return

    setIsUpdating(true)
    try {
      await onUpdateStatus(user._id, action, reason)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chi Tiết Người Dùng</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Thông Tin Người Dùng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ Và Tên
                </label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Điện Thoại
                </label>
                <p className="text-gray-900">{user.phone || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai Trò
                </label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng Thái
                </label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(user.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thành Viên Từ
                </label>
                <p className="text-gray-900">{formatDateTime(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Restaurant Information (if applicable) */}
          {user.role === 'restaurant' && user.restaurant && (
            <div>
              <h3 className="text-lg font-medium mb-4">Thông Tin Nhà Hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Nhà Hàng
                  </label>
                  <p className="text-gray-900">{user.restaurant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái Nhà Hàng
                  </label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.restaurant.status === 'approved' ? 'bg-green-100 text-green-800' :
                    user.restaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.restaurant.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Statistics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Thống Kê Tài Khoản</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Tổng Đơn Hàng</p>
                <p className="text-2xl font-bold text-gray-900">{user.orderCount || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Tổng Chi Tiêu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user.totalSpent ? `$${user.totalSpent.toFixed(2)}` : '$0.00'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Hoạt Động Cuối</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : 'Chưa bao giờ'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Quản Lý Trạng Thái Người Dùng</h3>
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
                  {user.status === 'suspended' ? (
                    <option value="activate">Mở Khóa Người Dùng</option>
                  ) : (
                    <option value="suspend">Khóa Người Dùng</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý Do (Tùy chọn)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Nhập lý do cho hành động này..."
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
                  {isUpdating ? 'Đang cập nhật...' : 'Cập Nhật Trạng Thái'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
