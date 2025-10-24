import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { paymentInfoService } from '../../services/paymentInfoService'
import { 
  User, Mail, Phone, MapPin, Calendar, Edit3, 
  Save, X, Key, Shield, CreditCard 
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
    phone: '',
    address: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [paymentMethods, setPaymentMethods] = useState([])
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    method: 'cod', // 'cod' or 'momo'
    deliveryAddress: {
      street: '',
      city: '',
      district: '',
      ward: ''
    },
    contactInfo: {
      name: '',
      phone: ''
    },
    momoPhone: '',
    isDefault: false
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: typeof user.address === 'object' ? user.address?.text || '' : user.address || ''
      })
    }
  }, [user])

  // Update profile address when default payment info changes
  useEffect(() => {
    const defaultPaymentInfo = paymentMethods.find(payment => payment.isDefault)
    if (defaultPaymentInfo) {
      const addressText = `${defaultPaymentInfo.deliveryAddress.street}, ${defaultPaymentInfo.deliveryAddress.ward}, ${defaultPaymentInfo.deliveryAddress.district}, ${defaultPaymentInfo.deliveryAddress.city}`
      setProfileForm(prev => ({
        ...prev,
        address: addressText
      }))
    }
  }, [paymentMethods])

  // Load payment info from API
  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const response = await paymentInfoService.getPaymentInfo()
        setPaymentMethods(response.data.paymentInfo || [])
      } catch (error) {
        console.error('Error loading payment info:', error)
      }
    }

    if (user) {
      loadPaymentInfo()
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

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('Mật khẩu mới không được giống mật khẩu hiện tại')
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
        phone: user.phone || '',
        address: typeof user.address === 'object' ? user.address?.text || '' : user.address || ''
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

  const handlePaymentFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setPaymentForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setPaymentForm(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleAddPayment = () => {
    setIsAddingPayment(true)
    setEditingPayment(null)
    setPaymentForm({
      method: 'cod',
      deliveryAddress: {
        street: '',
        city: '',
        district: '',
        ward: ''
      },
      contactInfo: {
        name: user?.name || '',
        phone: user?.phone || ''
      },
      momoPhone: '',
      isDefault: false
    })
  }

  const handleEditPayment = (payment) => {
    setEditingPayment(payment)
    setIsAddingPayment(true)
    setPaymentForm({
      method: payment.method || 'cod',
      deliveryAddress: payment.deliveryAddress || {
        street: '',
        city: '',
        district: '',
        ward: ''
      },
      contactInfo: payment.contactInfo || {
        name: user?.name || '',
        phone: user?.phone || ''
      },
      momoPhone: payment.momoPhone || '',
      isDefault: payment.isDefault || false
    })
  }

  const handleSavePayment = async (e) => {
    e.preventDefault()
    
    try {
      const paymentData = {
        contactInfo: paymentForm.contactInfo,
        deliveryAddress: paymentForm.deliveryAddress,
        isDefault: paymentForm.isDefault
      }

      if (editingPayment) {
        await paymentInfoService.updatePaymentInfo(editingPayment._id, paymentData)
        toast.success('Cập nhật thông tin giao hàng thành công')
      } else {
        await paymentInfoService.createPaymentInfo(paymentData)
        toast.success('Thêm thông tin giao hàng thành công')
      }

      // Reload payment info from API
      const response = await paymentInfoService.getPaymentInfo()
      setPaymentMethods(response.data.paymentInfo || [])

      setIsAddingPayment(false)
      setEditingPayment(null)
      setPaymentForm({
        method: 'cod',
        deliveryAddress: {
          street: '',
          city: '',
          district: '',
          ward: ''
        },
        contactInfo: {
          name: user?.name || '',
          phone: user?.phone || ''
        },
        momoPhone: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error saving payment info:', error)
      toast.error('Có lỗi xảy ra khi lưu thông tin giao hàng')
    }
  }

  const handleCancelPayment = () => {
    setIsAddingPayment(false)
    setEditingPayment(null)
    setPaymentForm({
      method: 'cod',
      deliveryAddress: {
        street: '',
        city: '',
        district: '',
        ward: ''
      },
      contactInfo: {
        name: user?.name || '',
        phone: user?.phone || ''
      },
      momoPhone: '',
      isDefault: false
    })
  }

  // Function để lấy địa chỉ từ tọa độ
  const getAddressFromCoordinates = async (latitude, longitude, accuracy) => {
    // Thử nhiều API để lấy địa chỉ chính xác
    let addressData = null
    
    try {
      // Thử API Nominatim (OpenStreetMap) trước
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FoodDeliveryApp/1.0'
          }
        }
      )
      
      if (nominatimResponse.ok) {
        addressData = await nominatimResponse.json()
        console.log('Nominatim Response:', addressData)
      }
    } catch (error) {
      console.log('Nominatim failed, trying BigDataCloud...')
    }
    
    // Nếu Nominatim không thành công, thử BigDataCloud
    if (!addressData) {
      try {
        const bigDataResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`
        )
        
        if (bigDataResponse.ok) {
          addressData = await bigDataResponse.json()
          console.log('BigDataCloud Response:', addressData)
        }
      } catch (error) {
        console.log('BigDataCloud failed, trying alternative...')
      }
    }
    
    // Nếu vẫn không có dữ liệu, thử API khác
    if (!addressData) {
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=vi&pretty=1`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.results && data.results.length > 0) {
            addressData = data.results[0]
            console.log('OpenCage Response:', addressData)
          }
        }
      } catch (error) {
        console.log('All APIs failed')
      }
    }
    
    // Xử lý dữ liệu địa chỉ
    let street = '', city = '', district = '', ward = ''
    
    console.log('Raw address data:', addressData)
    
    if (addressData.address) {
      // Nominatim format
      console.log('Using Nominatim format')
      street = addressData.address.road || addressData.address.house_number || addressData.address.pedestrian || ''
      city = addressData.address.city || addressData.address.town || addressData.address.village || addressData.address.municipality || ''
      district = addressData.address.county || addressData.address.state_district || addressData.address.district || ''
      ward = addressData.address.suburb || addressData.address.neighbourhood || addressData.address.quarter || ''
    } else if (addressData.localityInfo) {
      // BigDataCloud format
      console.log('Using BigDataCloud format')
      const addressComponents = addressData.localityInfo?.administrative || []
      street = addressData.locality || addressComponents[0]?.name || ''
      city = addressData.city || addressData.principalSubdivision || ''
      district = addressData.principalSubdivision || ''
      ward = addressData.locality || (addressComponents.length > 1 ? addressComponents[1].name : '')
    } else if (addressData.components) {
      // OpenCage format
      console.log('Using OpenCage format')
      street = addressData.components.road || addressData.components.house_number || ''
      city = addressData.components.city || addressData.components.town || addressData.components.village || ''
      district = addressData.components.county || addressData.components.state_district || ''
      ward = addressData.components.suburb || addressData.components.neighbourhood || ''
    } else {
      // Fallback - thử lấy từ display_name
      console.log('Using fallback format')
      const displayName = addressData.display_name || ''
      if (displayName) {
        // Tách địa chỉ từ display_name
        const parts = displayName.split(', ')
        if (parts.length >= 3) {
          street = parts[0] || ''
          ward = parts[1] || ''
          district = parts[2] || ''
          city = parts[parts.length - 1] || ''
        }
      }
    }
    
    // Nếu vẫn không có dữ liệu, tạo địa chỉ từ tọa độ
    if (!street && !city && !district && !ward) {
      console.log('Creating fallback address from coordinates')
      street = `Vị trí GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      city = 'Thành phố Hồ Chí Minh'
      district = 'Quận 1'
      ward = 'Phường Bến Nghé'
    }
    
    console.log('Processed address:', { street, city, district, ward })
    
    setPaymentForm(prev => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        street: street,
        city: city,
        district: district,
        ward: ward
      }
    }))
    
    console.log('Form updated with address')
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị')
      return
    }

    toast.loading('Đang lấy vị trí chính xác...', { id: 'location' })

    // Sử dụng watchPosition để chờ hội tụ GPS/Wi-Fi
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // Chỉ xử lý khi độ chính xác đạt yêu cầu (dưới 200m cho điện thoại)
        if (accuracy > 200) {
          console.log(`Độ chính xác: ${Math.round(accuracy)}m - Chờ hội tụ...`)
          return
        }
        
        // Dừng watchPosition khi đã có độ chính xác tốt
        navigator.geolocation.clearWatch(watchId)
        
        console.log(`Tọa độ chính xác: ${latitude}, ${longitude} (Độ chính xác: ${Math.round(accuracy)}m)`)
        
        try {
          // Lấy địa chỉ từ tọa độ
          await getAddressFromCoordinates(latitude, longitude, accuracy)
          toast.success(`Đã lấy vị trí thành công! (Độ chính xác: ${Math.round(accuracy)}m)`, { id: 'location' })
        } catch (error) {
          console.error('Error getting address:', error)
          toast.error('Không thể lấy địa chỉ từ vị trí', { id: 'location' })
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        navigator.geolocation.clearWatch(watchId)
        
        let errorMessage = 'Không thể lấy vị trí'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Bạn đã từ chối quyền truy cập vị trí'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Vị trí không khả dụng'
            break
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ lấy vị trí'
            break
        }
        
        toast.error(errorMessage, { id: 'location' })
      },
      {
        enableHighAccuracy: true,    // Bật độ chính xác cao (GPS)
        timeout: 60000,              // Tăng timeout lên 60s để chờ GPS
        maximumAge: 0                // Không sử dụng cache, luôn lấy vị trí mới
      }
    )
    
    // Timeout fallback - nếu sau 60s vẫn không có độ chính xác tốt, thử lấy vị trí với độ chính xác thấp hơn
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId)
      
      // Thử lấy vị trí với độ chính xác thấp hơn (Wi-Fi/Network)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log(`Fallback vị trí: ${latitude}, ${longitude} (Độ chính xác: ${Math.round(accuracy)}m)`)
          
          try {
            // Lấy địa chỉ từ vị trí fallback
            await getAddressFromCoordinates(latitude, longitude, accuracy)
            toast.success(`Đã lấy vị trí (Wi-Fi/Network)! (Độ chính xác: ${Math.round(accuracy)}m)`, { id: 'location' })
          } catch (error) {
            console.error('Error getting address from fallback location:', error)
            toast.error('Không thể lấy địa chỉ từ vị trí', { id: 'location' })
          }
        },
        (error) => {
          console.error('Fallback geolocation error:', error)
          toast.error('Không thể lấy vị trí, vui lòng thử lại', { id: 'location' })
        },
        {
          enableHighAccuracy: false,   // Chấp nhận Wi-Fi/Network
          timeout: 10000,
          maximumAge: 300000
        }
      )
    }, 60000)
  }

  const handleDeletePayment = (paymentId) => {
    setPaymentToDelete(paymentId)
    setShowDeleteConfirm(true)
  }

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return

    try {
      await paymentInfoService.deletePaymentInfo(paymentToDelete)
      
      // Reload payment info from API
      const response = await paymentInfoService.getPaymentInfo()
      setPaymentMethods(response.data.paymentInfo || [])
      
      toast.success('Xóa thông tin giao hàng thành công')
    } catch (error) {
      console.error('Error deleting payment info:', error)
      toast.error('Có lỗi xảy ra khi xóa thông tin giao hàng')
    } finally {
      setShowDeleteConfirm(false)
      setPaymentToDelete(null)
    }
  }

  const cancelDeletePayment = () => {
    setShowDeleteConfirm(false)
    setPaymentToDelete(null)
  }

  const handleSetDefaultPayment = async (paymentId) => {
    try {
      await paymentInfoService.setDefaultPaymentInfo(paymentId)
      
      // Reload payment info from API
      const response = await paymentInfoService.getPaymentInfo()
      setPaymentMethods(response.data.paymentInfo || [])
      
      // Update profile address with new default address
      const newDefaultInfo = response.data.paymentInfo?.find(info => info.isDefault)
      if (newDefaultInfo) {
        const addressText = `${newDefaultInfo.deliveryAddress.street}, ${newDefaultInfo.deliveryAddress.ward}, ${newDefaultInfo.deliveryAddress.district}, ${newDefaultInfo.deliveryAddress.city}`
        setProfileForm(prev => ({
          ...prev,
          address: addressText
        }))
      }
      
      toast.success('Đặt làm thông tin giao hàng mặc định')
    } catch (error) {
      console.error('Error setting default payment info:', error)
      toast.error('Có lỗi xảy ra khi đặt mặc định')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Hồ Sơ', icon: User },
    { id: 'security', label: 'Bảo Mật', icon: Shield },
    { id: 'billing', label: 'Thông tin giao hàng', icon: MapPin }
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


          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <BillingTab 
              user={user}
              paymentMethods={paymentMethods}
              isAddingPayment={isAddingPayment}
              editingPayment={editingPayment}
              paymentForm={paymentForm}
              onFormChange={handlePaymentFormChange}
              onAdd={handleAddPayment}
              onEdit={handleEditPayment}
              onSave={handleSavePayment}
              onCancel={handleCancelPayment}
              onDelete={handleDeletePayment}
              onSetDefault={handleSetDefaultPayment}
              onGetCurrentLocation={handleGetCurrentLocation}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa thông tin giao hàng này?
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDeletePayment}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeletePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
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
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{user.email}</span>
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
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
                {typeof user.address === 'object' ? user.address?.text || 'Chưa cung cấp' : user.address || 'Chưa cung cấp'}
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
              className="btn btn-primary whitespace-nowrap px-6"
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

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">Mật khẩu</span>
              </div>
              <span className="text-sm text-gray-500">••••••••</span>
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


// Billing Tab Component
function BillingTab({ 
  user, 
  paymentMethods, 
  isAddingPayment, 
  editingPayment, 
  paymentForm, 
  onFormChange, 
  onAdd, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onSetDefault,
  onGetCurrentLocation
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Thông Tin Giao Hàng</h2>
        {!isAddingPayment && (
            <button
              onClick={onAdd}
              className="btn btn-primary btn-sm flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Thêm thông tin giao hàng</span>
            </button>
        )}
      </div>

      {isAddingPayment ? (
        <PaymentForm
          form={paymentForm}
          editingPayment={editingPayment}
          onFormChange={onFormChange}
          onSave={onSave}
          onCancel={onCancel}
          onGetCurrentLocation={onGetCurrentLocation}
        />
      ) : (
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có thông tin giao hàng
              </h3>
              <p className="text-gray-600 mb-4">
                Thêm thông tin giao hàng để có thể chọn nhanh khi đặt hàng
              </p>
              <button
                onClick={onAdd}
                className="btn btn-primary"
              >
                Thêm thông tin giao hàng
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((payment) => (
                <PaymentMethodCard
                  key={payment._id}
                  payment={payment}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSetDefault={onSetDefault}
                />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// Payment Form Component
function PaymentForm({ form, editingPayment, onFormChange, onSave, onCancel, onGetCurrentLocation }) {
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: '💰',
      recommended: true
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      description: 'Thanh toán qua ví điện tử MoMo',
      icon: '💳',
      recommended: false
    }
  ]

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingPayment ? 'Chỉnh sửa thông tin giao hàng' : 'Thêm thông tin giao hàng'}
        </h3>
        
        {/* Contact Information */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Thông Tin Liên Hệ</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ Tên *
              </label>
              <input
                type="text"
                value={form.contactInfo.name}
                onChange={(e) => onFormChange('contactInfo.name', e.target.value)}
                className="input w-full"
                placeholder="Nhập họ tên của bạn"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại *
              </label>
              <input
                type="tel"
                value={form.contactInfo.phone}
                onChange={(e) => onFormChange('contactInfo.phone', e.target.value)}
                className="input w-full"
                placeholder="Nhập số điện thoại"
                required
              />
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Địa chỉ Giao Hàng</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa Chỉ Đường *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={form.deliveryAddress.street}
                  onChange={(e) => onFormChange('deliveryAddress.street', e.target.value)}
                  className="input flex-1"
                  placeholder="Nhập địa chỉ đường của bạn"
                  required
                />
                <button
                  type="button"
                  onClick={onGetCurrentLocation}
                  className="btn btn-outline flex items-center space-x-2 whitespace-nowrap"
                  title="Lấy vị trí hiện tại"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Vị trí của bạn</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phường/Xã *
              </label>
              <input
                type="text"
                value={form.deliveryAddress.ward}
                onChange={(e) => onFormChange('deliveryAddress.ward', e.target.value)}
                className="input w-full"
                placeholder="Tên phường"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quận/Huyện *
              </label>
              <input
                type="text"
                value={form.deliveryAddress.district}
                onChange={(e) => onFormChange('deliveryAddress.district', e.target.value)}
                className="input w-full"
                placeholder="Quận 1"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thành Phố *
              </label>
              <input
                type="text"
                value={form.deliveryAddress.city}
                onChange={(e) => onFormChange('deliveryAddress.city', e.target.value)}
                className="input w-full"
                placeholder="Thành phố Hồ Chí Minh"
                required
              />
            </div>
          </div>
        </div>


        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => onFormChange('isDefault', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Đặt làm phương thức thanh toán mặc định</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
          >
            <X className="h-4 w-4 mr-2" />
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {editingPayment ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Payment Method Card Component
function PaymentMethodCard({ payment, onEdit, onDelete, onSetDefault }) {
  return (
    <div className={`p-4 border rounded-lg ${payment.isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">Thông tin giao hàng</span>
            {payment.isDefault && (
              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                Mặc định
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Họ tên:</span> {payment.contactInfo?.name}</p>
            <p><span className="font-medium">SĐT:</span> {payment.contactInfo?.phone}</p>
            <p><span className="font-medium">Địa chỉ:</span> {payment.deliveryAddress?.street}, {payment.deliveryAddress?.ward}, {payment.deliveryAddress?.district}, {payment.deliveryAddress?.city}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!payment.isDefault && (
            <button
              onClick={() => onSetDefault(payment._id)}
              className="btn btn-outline btn-sm"
              title="Đặt làm mặc định"
            >
              Mặc định
            </button>
          )}
          <button
            onClick={() => onEdit(payment)}
            className="btn btn-outline btn-sm"
            title="Chỉnh sửa"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(payment._id)}
            className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
            title="Xóa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile

