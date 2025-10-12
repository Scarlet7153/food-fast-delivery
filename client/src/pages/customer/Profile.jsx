import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { 
  User, Mail, Phone, MapPin, Calendar, Edit3, 
  Save, X, Key, Shield, Bell, CreditCard 
} from 'lucide-react'
import { formatDateTime, formatPhoneNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function Profile() {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
  }, [user])

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await updateProfile(profileForm)
      setIsEditing(false)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới không khớp')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setIsChangingPassword(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleCancelEdit = () => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
    setIsEditing(false)
  }

  const handleCancelPasswordChange = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setIsChangingPassword(false)
  }

  const tabs = [
    { id: 'profile', label: 'Hồ Sơ', icon: User },
    { id: 'security', label: 'Bảo Mật', icon: Shield },
    { id: 'preferences', label: 'Tùy Chọn', icon: Bell },
    { id: 'billing', label: 'Thanh Toán', icon: CreditCard }
  ]

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy hồ sơ
        </h2>
        <p className="text-gray-600">
          Không thể tải thông tin hồ sơ.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">
              Thành viên từ {formatDateTime(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              profileForm={profileForm}
              isEditing={isEditing}
              isLoading={isLoading}
              onFormChange={handleProfileChange}
              onSubmit={handleProfileSubmit}
              onEdit={() => setIsEditing(true)}
              onCancel={handleCancelEdit}
            />
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <SecurityTab
              passwordForm={passwordForm}
              isChangingPassword={isChangingPassword}
              isLoading={isLoading}
              onFormChange={handlePasswordChange}
              onSubmit={handlePasswordSubmit}
              onEdit={() => setIsChangingPassword(true)}
              onCancel={handleCancelPasswordChange}
            />
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <PreferencesTab user={user} />
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <BillingTab user={user} />
          )}
        </div>
      </div>
    </div>
  )
}

// Profile Tab Component
function ProfileTab({ user, profileForm, isEditing, isLoading, onFormChange, onSubmit, onEdit, onCancel }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Thông Tin Hồ Sơ</h2>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Sửa</span>
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ Và Tên
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                className="input w-full"
                required
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{user.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa Chỉ Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="input w-full"
                required
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{user.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số Điện Thoại
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className="input w-full"
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {user.phone ? formatPhoneNumber(user.phone) : 'Chưa cung cấp'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại Tài Khoản
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa Chỉ
          </label>
          {isEditing ? (
            <textarea
              value={profileForm.address}
              onChange={(e) => onFormChange('address', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Nhập địa chỉ"
            />
          ) : (
            <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-gray-900">
                {user.address || 'Chưa cung cấp'}
              </span>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu Thay Đổi
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

// Security Tab Component
function SecurityTab({ passwordForm, isChangingPassword, isLoading, onFormChange, onSubmit, onEdit, onCancel }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cài Đặt Bảo Mật</h2>
        {!isChangingPassword && (
          <button
            onClick={onEdit}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Key className="h-4 w-4" />
            <span>Đổi Mật Khẩu</span>
          </button>
        )}
      </div>

      {!isChangingPassword ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Bảo Mật Tài Khoản</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Tài khoản của bạn được bảo mật bằng mã hóa tiêu chuẩn ngành.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">Mật khẩu</span>
              </div>
              <span className="text-sm text-gray-500">••••••••</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">Xác Thực Hai Yếu Tố</span>
              </div>
              <span className="text-sm text-gray-500">Chưa bật</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật Khẩu Hiện Tại
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => onFormChange('currentPassword', e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật Khẩu Mới
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => onFormChange('newPassword', e.target.value)}
              className="input w-full"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác Nhận Mật Khẩu Mới
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => onFormChange('confirmPassword', e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Đang đổi...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Đổi Mật Khẩu
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab({ user }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Tùy Chọn Thông Báo</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Cập Nhật Đơn Hàng</p>
              <p className="text-sm text-gray-600">Nhận thông báo về thay đổi trạng thái đơn hàng</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Thông Báo Giao Hàng</p>
              <p className="text-sm text-gray-600">Nhận thông báo khi drone đang đến gần</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Ưu Đãi Khuyến Mãi</p>
              <p className="text-sm text-gray-600">Nhận ưu đãi đặc biệt và giảm giá</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

// Billing Tab Component
function BillingTab({ user }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Thông Tin Thanh Toán</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Phương Thức Thanh Toán</span>
          </div>
          <p className="text-sm text-gray-600">
            Chưa lưu phương thức thanh toán. Thanh toán được xử lý an toàn qua tích hợp ví MoMo.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Lịch Sử Đơn Hàng</span>
          </div>
          <p className="text-sm text-gray-600">
            Xem lịch sử đơn hàng đầy đủ và hóa đơn trong phần Đơn Hàng.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Bảo Mật</span>
          </div>
          <p className="text-sm text-gray-600">
            Tất cả thanh toán được xử lý an toàn qua kênh mã hóa. Chúng tôi không bao giờ lưu trữ thông tin thanh toán của bạn.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile

