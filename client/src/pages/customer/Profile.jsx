import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { 
  User, Mail, Phone, MapPin, Calendar, Edit3, 
  Save, X, Key, Shield, Bell, CreditCard 
} from 'lucide-react'
import { formatDateTime, formatPhoneNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

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
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
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
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Profile not found
        </h2>
        <p className="text-gray-600">
          Unable to load profile information.
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
              Member since {formatDateTime(user.createdAt)}
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
        <h2 className="text-lg font-semibold">Profile Information</h2>
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
              Full Name
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
              Email Address
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
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className="input w-full"
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {user.phone ? formatPhoneNumber(user.phone) : 'Not provided'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          {isEditing ? (
            <textarea
              value={profileForm.address}
              onChange={(e) => onFormChange('address', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Enter your address"
            />
          ) : (
            <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-gray-900">
                {user.address || 'Not provided'}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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
        <h2 className="text-lg font-semibold">Security Settings</h2>
        {!isChangingPassword && (
          <button
            onClick={onEdit}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Key className="h-4 w-4" />
            <span>Change Password</span>
          </button>
        )}
      </div>

      {!isChangingPassword ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Account Security</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Your account is secured with industry-standard encryption.
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
                <span className="text-gray-900">Two-Factor Authentication</span>
              </div>
              <span className="text-sm text-gray-500">Not enabled</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
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
              New Password
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
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
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
                  Changing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Change Password
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
      <h2 className="text-lg font-semibold">Notification Preferences</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Order Updates</p>
              <p className="text-sm text-gray-600">Get notified about order status changes</p>
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
              <p className="font-medium text-gray-900">Delivery Notifications</p>
              <p className="text-sm text-gray-600">Get notified when your drone is approaching</p>
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
              <p className="font-medium text-gray-900">Promotional Offers</p>
              <p className="text-sm text-gray-600">Receive special offers and discounts</p>
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
      <h2 className="text-lg font-semibold">Billing Information</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Payment Methods</span>
          </div>
          <p className="text-sm text-gray-600">
            No payment methods saved. Payment methods are handled securely through MoMo wallet integration.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Order History</span>
          </div>
          <p className="text-sm text-gray-600">
            View your complete order history and receipts in the Orders section.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Security</span>
          </div>
          <p className="text-sm text-gray-600">
            All payments are processed securely through encrypted channels. We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile

