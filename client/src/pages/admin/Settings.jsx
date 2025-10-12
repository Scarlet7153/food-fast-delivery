import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminService } from '../../services/adminService'
import { 
  Settings as SettingsIcon, Save, RefreshCw, AlertTriangle,
  Globe, Shield, Bell, Database, Server, Users, DollarSign,
  CheckCircle, XCircle, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const queryClient = useQueryClient()

  // Fetch system settings
  const { data: settingsData, isLoading } = useQuery(
    'admin-settings',
    () => adminService.getSystemSettings(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (settings) => adminService.updateSystemSettings(settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-settings')
        toast.success('Cập nhật cài đặt thành công')
      },
      onError: (error) => {
        toast.error('Không thể cập nhật cài đặt')
      }
    }
  )

  const settings = settingsData?.data || {}

  const tabs = [
    { id: 'general', label: 'Chung', icon: Globe },
    { id: 'security', label: 'Bảo Mật', icon: Shield },
    { id: 'notifications', label: 'Thông Báo', icon: Bell },
    { id: 'database', label: 'Cơ Sở Dữ Liệu', icon: Database },
    { id: 'payment', label: 'Thanh toán', icon: DollarSign },
    { id: 'api', label: 'API', icon: Server },
  ]

  const handleSaveSettings = async (sectionSettings) => {
    await updateSettingsMutation.mutateAsync(sectionSettings)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
        <p className="text-gray-600 mt-1">
          Cấu hình cài đặt và tùy chọn toàn nền tảng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border">
            {activeTab === 'general' && (
              <GeneralSettings 
                settings={settings.general} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'security' && (
              <SecuritySettings 
                settings={settings.security} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'notifications' && (
              <NotificationSettings 
                settings={settings.notifications} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'database' && (
              <DatabaseSettings 
                settings={settings.database} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'payment' && (
              <PaymentSettings 
                settings={settings.payment} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'api' && (
              <ApiSettings 
                settings={settings.api} 
                onSave={handleSaveSettings}
                isLoading={isLoading}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                showSecretKey={showSecretKey}
                setShowSecretKey={setShowSecretKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// General Settings Component
function GeneralSettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    platformName: settings?.platformName || 'Fast Food Delivery Drone',
    platformDescription: settings?.platformDescription || '',
    timezone: settings?.timezone || 'UTC',
    language: settings?.language || 'en',
    currency: settings?.currency || 'USD',
    dateFormat: settings?.dateFormat || 'MM/DD/YYYY',
    timeFormat: settings?.timeFormat || '12h',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ general: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cài Đặt Chung</h2>
          <p className="text-gray-600 mt-1">Cấu hình cài đặt nền tảng cơ bản</p>
        </div>
        <SettingsIcon className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên Nền Tảng
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              className="input w-full"
              placeholder="Nhập tên nền tảng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiền Tệ
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input w-full"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngôn Ngữ
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="input w-full"
            >
              <option value="en">Tiếng Anh</option>
              <option value="vi">Tiếng Việt</option>
              <option value="es">Tiếng Tây Ban Nha</option>
              <option value="fr">Tiếng Pháp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Múi Giờ
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="input w-full"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Giờ Đông Bắc Mỹ</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Ho_Chi_Minh">Thành phố Hồ Chí Minh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Định Dạng Ngày
            </label>
            <select
              value={formData.dateFormat}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
              className="input w-full"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Định Dạng Giờ
            </label>
            <select
              value={formData.timeFormat}
              onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
              className="input w-full"
            >
              <option value="12h">12 Giờ (AM/PM)</option>
              <option value="24h">24 Giờ</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô Tả Nền Tảng
          </label>
          <textarea
            value={formData.platformDescription}
            onChange={(e) => setFormData({ ...formData, platformDescription: e.target.value })}
            className="input w-full"
            rows={4}
            placeholder="Nhập mô tả nền tảng"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Security Settings Component
function SecuritySettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    sessionTimeout: settings?.sessionTimeout || 30,
    passwordMinLength: settings?.passwordMinLength || 8,
    maxLoginAttempts: settings?.maxLoginAttempts || 5,
    lockoutDuration: settings?.lockoutDuration || 15,
    requireEmailVerification: settings?.requireEmailVerification || true,
    enableTwoFactor: settings?.enableTwoFactor || false,
    jwtExpiry: settings?.jwtExpiry || 15,
    refreshTokenExpiry: settings?.refreshTokenExpiry || 7,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ security: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cài Đặt Bảo Mật</h2>
          <p className="text-gray-600 mt-1">Cấu hình chính sách bảo mật và xác thực</p>
        </div>
        <Shield className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Gian Hết Hạn Phiên (phút)
            </label>
            <input
              type="number"
              value={formData.sessionTimeout}
              onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
              className="input w-full"
              min="5"
              max="480"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ Dài Tối Thiểu Mật Khẩu
            </label>
            <input
              type="number"
              value={formData.passwordMinLength}
              onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) })}
              className="input w-full"
              min="6"
              max="32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số Lần Đăng Nhập Tối Đa
            </label>
            <input
              type="number"
              value={formData.maxLoginAttempts}
              onChange={(e) => setFormData({ ...formData, maxLoginAttempts: parseInt(e.target.value) })}
              className="input w-full"
              min="3"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Gian Khóa (phút)
            </label>
            <input
              type="number"
              value={formData.lockoutDuration}
              onChange={(e) => setFormData({ ...formData, lockoutDuration: parseInt(e.target.value) })}
              className="input w-full"
              min="5"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Hạn Token JWT (phút)
            </label>
            <input
              type="number"
              value={formData.jwtExpiry}
              onChange={(e) => setFormData({ ...formData, jwtExpiry: parseInt(e.target.value) })}
              className="input w-full"
              min="5"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Hạn Refresh Token (ngày)
            </label>
            <input
              type="number"
              value={formData.refreshTokenExpiry}
              onChange={(e) => setFormData({ ...formData, refreshTokenExpiry: parseInt(e.target.value) })}
              className="input w-full"
              min="1"
              max="30"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Yêu Cầu Xác Thực Email</label>
              <p className="text-sm text-gray-500">Người dùng phải xác thực địa chỉ email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireEmailVerification}
                onChange={(e) => setFormData({ ...formData, requireEmailVerification: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Bật Xác Thực Hai Yếu Tố</label>
              <p className="text-sm text-gray-500">Thêm bảo mật với 2FA</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableTwoFactor}
                onChange={(e) => setFormData({ ...formData, enableTwoFactor: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Notification Settings Component
function NotificationSettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    emailNotifications: settings?.emailNotifications || true,
    pushNotifications: settings?.pushNotifications || true,
    smsNotifications: settings?.smsNotifications || false,
    orderUpdates: settings?.orderUpdates || true,
    systemAlerts: settings?.systemAlerts || true,
    marketingEmails: settings?.marketingEmails || false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ notifications: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-gray-600 mt-1">Configure notification preferences</p>
        </div>
        <Bell className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-500">Send notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Push Notifications</label>
              <p className="text-sm text-gray-500">Send browser push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pushNotifications}
                onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
              <p className="text-sm text-gray-500">Send notifications via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smsNotifications}
                onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Order Updates</label>
              <p className="text-sm text-gray-500">Notify about order status changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.orderUpdates}
                onChange={(e) => setFormData({ ...formData, orderUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">System Alerts</label>
              <p className="text-sm text-gray-500">Notify about system issues and maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.systemAlerts}
                onChange={(e) => setFormData({ ...formData, systemAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
              <p className="text-sm text-gray-500">Send promotional and marketing content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marketingEmails}
                onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Database Settings Component
function DatabaseSettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    backupInterval: settings?.backupInterval || 24,
    retentionDays: settings?.retentionDays || 30,
    autoOptimize: settings?.autoOptimize || true,
    queryTimeout: settings?.queryTimeout || 30,
    maxConnections: settings?.maxConnections || 100,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ database: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Database Settings</h2>
          <p className="text-gray-600 mt-1">Configure database performance and maintenance</p>
        </div>
        <Database className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Interval (hours)
            </label>
            <input
              type="number"
              value={formData.backupInterval}
              onChange={(e) => setFormData({ ...formData, backupInterval: parseInt(e.target.value) })}
              className="input w-full"
              min="1"
              max="168"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retention Days
            </label>
            <input
              type="number"
              value={formData.retentionDays}
              onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
              className="input w-full"
              min="7"
              max="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Timeout (seconds)
            </label>
            <input
              type="number"
              value={formData.queryTimeout}
              onChange={(e) => setFormData({ ...formData, queryTimeout: parseInt(e.target.value) })}
              className="input w-full"
              min="5"
              max="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Connections
            </label>
            <input
              type="number"
              value={formData.maxConnections}
              onChange={(e) => setFormData({ ...formData, maxConnections: parseInt(e.target.value) })}
              className="input w-full"
              min="10"
              max="1000"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Auto Optimize</label>
            <p className="text-sm text-gray-500">Automatically optimize database performance</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoOptimize}
              onChange={(e) => setFormData({ ...formData, autoOptimize: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Payment Settings Component
function PaymentSettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    platformFeePercentage: settings?.platformFeePercentage || 5,
    paymentMethod: settings?.paymentMethod || 'momo',
    refundPolicy: settings?.refundPolicy || '24h',
    currency: settings?.currency || 'VND',
    enableRefunds: settings?.enableRefunds || true,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ payment: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
          <p className="text-gray-600 mt-1">Configure payment processing and fees</p>
        </div>
        <DollarSign className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Fee Percentage
            </label>
            <input
              type="number"
              value={formData.platformFeePercentage}
              onChange={(e) => setFormData({ ...formData, platformFeePercentage: parseFloat(e.target.value) })}
              className="input w-full"
              min="0"
              max="20"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="input w-full"
            >
              <option value="momo">MoMo</option>
              <option value="vnpay">VNPay</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Policy
            </label>
            <select
              value={formData.refundPolicy}
              onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
              className="input w-full"
            >
              <option value="24h">24 Hours</option>
              <option value="48h">48 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiền Tệ
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input w-full"
            >
              <option value="VND">Vietnamese Dong (₫)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable Refunds</label>
            <p className="text-sm text-gray-500">Allow customers to request refunds</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableRefunds}
              onChange={(e) => setFormData({ ...formData, enableRefunds: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// API Settings Component
function ApiSettings({ settings, onSave, isLoading, showApiKey, setShowApiKey, showSecretKey, setShowSecretKey }) {
  const [formData, setFormData] = useState({
    rateLimit: settings?.rateLimit || 1000,
    apiVersion: settings?.apiVersion || 'v1',
    enableCors: settings?.enableCors || true,
    enableSwagger: settings?.enableSwagger || true,
    webhookUrl: settings?.webhookUrl || '',
    apiKey: settings?.apiKey || '',
    secretKey: settings?.secretKey || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({ api: formData })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Settings</h2>
          <p className="text-gray-600 mt-1">Configure API access and integration</p>
        </div>
        <Server className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={formData.rateLimit}
              onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
              className="input w-full"
              min="100"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Version
            </label>
            <select
              value={formData.apiVersion}
              onChange={(e) => setFormData({ ...formData, apiVersion: e.target.value })}
              className="input w-full"
            >
              <option value="v1">v1</option>
              <option value="v2">v2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="input w-full pr-10"
                placeholder="Enter API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                className="input w-full pr-10"
                placeholder="Enter secret key"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <input
            type="url"
            value={formData.webhookUrl}
            onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
            className="input w-full"
            placeholder="https://example.com/webhook"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable CORS</label>
              <p className="text-sm text-gray-500">Allow cross-origin requests</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableCors}
                onChange={(e) => setFormData({ ...formData, enableCors: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Swagger</label>
              <p className="text-sm text-gray-500">Enable API documentation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSwagger}
                onChange={(e) => setFormData({ ...formData, enableSwagger: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Cài Đặt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminSettings
