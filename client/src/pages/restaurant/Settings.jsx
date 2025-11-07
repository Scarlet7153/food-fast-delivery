import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { 
  Save, Edit, X, MapPin, Phone, Clock, DollarSign,
  Image, Truck, Info, User, Power
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'
import ImageUpload from '../../components/ImageUpload'

function RestaurantSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    imageUrl: '',
    deliverySettings: {
      baseRate: 10000,
      ratePerKm: 2000,
      estimatedPrepTime: 30,
      maxDeliveryDistance: 10
    }
  })
  const queryClient = useQueryClient()

  // Fetch restaurant data
  const { data: restaurantData, isLoading } = useQuery(
    'restaurant-profile',
    () => restaurantService.getMyRestaurant(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Update restaurant mutation
  const updateRestaurantMutation = useMutation(
    (data) => restaurantService.updateMyRestaurant(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-profile'])
        setIsEditing(false)
        toast.success('Cập nhật cài đặt nhà hàng thành công')
      },
      onError: (error) => {
        console.error('Update restaurant error:', error.response?.data)
        const errorMessage = error.response?.data?.error || 'Không thể cập nhật cài đặt nhà hàng'
        toast.error(errorMessage)
      }
    }
  )

  // Toggle restaurant status mutation
  const toggleStatusMutation = useMutation(
    () => restaurantService.toggleRestaurantStatus(),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['restaurant-profile'])
        toast.success(response.data.message || 'Đã cập nhật trạng thái cửa hàng')
      },
      onError: (error) => {
        console.error('Toggle status error:', error.response?.data)
        const errorMessage = error.response?.data?.error || 'Không thể thay đổi trạng thái cửa hàng'
        toast.error(errorMessage)
      }
    }
  )

  // Initialize form with restaurant data
  useEffect(() => {
    if (restaurantData?.data?.restaurant) {
      const restaurant = restaurantData.data.restaurant
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || restaurant.ownerEmail || '',
        imageUrl: restaurant.imageUrl || '',
        deliverySettings: {
          baseRate: restaurant.deliverySettings?.baseRate || 10000,
          ratePerKm: restaurant.deliverySettings?.ratePerKm || 2000,
          estimatedPrepTime: restaurant.deliverySettings?.estimatedPrepTime || 30,
          maxDeliveryDistance: restaurant.deliverySettings?.maxDeliveryDistance || 10
        }
      })
    }
  }, [restaurantData])

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
    
    // Remove email field from update data (email cannot be changed)
    const { email, ...updateData } = formData
    updateRestaurantMutation.mutate(updateData)
  }

  const handleCancel = () => {
    if (restaurantData?.data?.restaurant) {
      const restaurant = restaurantData.data.restaurant
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || restaurant.ownerEmail || '',
        imageUrl: restaurant.imageUrl || '',
        deliverySettings: {
          baseRate: restaurant.deliverySettings?.baseRate || 10000,
          ratePerKm: restaurant.deliverySettings?.ratePerKm || 2000,
          estimatedPrepTime: restaurant.deliverySettings?.estimatedPrepTime || 30,
          maxDeliveryDistance: restaurant.deliverySettings?.maxDeliveryDistance || 10
        }
      })
    }
    setIsEditing(false)
  }

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông Tin Nhà Hàng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin nhà hàng và cài đặt giao hàng
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="btn btn-outline flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateRestaurantMutation.isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <Save className="h-4 w-4" />
                <span>
                  {updateRestaurantMutation.isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Edit className="h-4 w-4" />
              <span>Sửa Thông Tin</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Thông Tin Cơ Bản</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên Nhà Hàng *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input w-full"
                  required
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{formData.name}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="input w-full"
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{formData.description || 'Chưa có mô tả'}</span>
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
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="input w-full"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.phone || 'Chưa có số điện thoại'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa Chỉ Email
              </label>
              <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
                <span className="text-gray-600 text-sm">{formData.email || 'Chưa có email'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email đăng ký tài khoản (không thể thay đổi)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa Chỉ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input w-full"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.address || 'Chưa có địa chỉ'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình Ảnh Nhà Hàng <span className="text-gray-500 text-sm">(Tùy chọn)</span>
              </label>
              {isEditing ? (
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(value) => handleChange('imageUrl', value)}
                  disabled={updateRestaurantMutation.isLoading}
                />
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg">
                  {formData.imageUrl ? (
                    <div className="flex flex-col items-center justify-center">
                      <img 
                        src={formData.imageUrl} 
                        alt="Hình ảnh nhà hàng"
                        className="h-96 w-auto max-w-full object-cover rounded-lg border shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="mt-4 flex items-center space-x-2" style={{display: 'none'}}>
                        <Image className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 text-sm break-all">{formData.imageUrl}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 py-8">
                      <Image className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-900">Chưa có hình ảnh nhà hàng</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Truck className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Cài Đặt Giao Hàng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phí Giao Hàng Cơ Bản (VND)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.baseRate}
                  onChange={(e) => handleChange('deliverySettings.baseRate', parseInt(e.target.value))}
                  className="input w-full"
                  min="0"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatCurrency(formData.deliverySettings.baseRate)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phí Theo Kilomet (VND)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.ratePerKm}
                  onChange={(e) => handleChange('deliverySettings.ratePerKm', parseInt(e.target.value))}
                  className="input w-full"
                  min="0"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatCurrency(formData.deliverySettings.ratePerKm)}/km</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời Gian Giao Hàng Dự Kiến
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.estimatedPrepTime}
                  onChange={(e) => handleChange('deliverySettings.estimatedPrepTime', parseInt(e.target.value))}
                  className="input w-full"
                  min="5"
                  max="120"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.deliverySettings.estimatedPrepTime} phút</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng Cách Giao Hàng Tối Đa (km)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.maxDeliveryDistance}
                  onChange={(e) => handleChange('deliverySettings.maxDeliveryDistance', parseInt(e.target.value))}
                  className="input w-full"
                  min="1"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.deliverySettings.maxDeliveryDistance} km</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Power className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Trạng Thái Cửa Hàng</h2>
            </div>
            {restaurantData?.data?.restaurant && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                restaurantData.data.restaurant.isOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurantData.data.restaurant.isOpen ? 'Đang mở cửa' : 'Đang đóng cửa'}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {restaurantData?.data?.restaurant?.isOpen 
                ? 'Cửa hàng đang mở và có thể nhận đơn hàng từ khách hàng.'
                : 'Cửa hàng đang đóng, khách hàng không thể đặt hàng.'}
            </p>
            
            {restaurantData?.data?.restaurant?.approved ? (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={toggleStatusMutation.isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  restaurantData?.data?.restaurant?.isOpen
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {toggleStatusMutation.isLoading ? 'Đang xử lý...' : (
                  restaurantData?.data?.restaurant?.isOpen 
                    ? 'Đóng Cửa Hàng' 
                    : 'Mở Cửa Hàng'
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-amber-600">
                  Cửa hàng cần được duyệt bởi admin trước khi có thể mở cửa
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default RestaurantSettings