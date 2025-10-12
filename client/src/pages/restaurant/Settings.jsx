import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { 
  Save, Edit, X, MapPin, Phone, Clock, DollarSign,
  Image, Truck, Settings as SettingsIcon, User
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

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
      perKmRate: 2000,
      estimatedTime: '25-35',
      maxDistance: 10
    },
    operatingHours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '22:00', closed: false },
      sunday: { open: '08:00', close: '22:00', closed: false }
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
        toast.success('Restaurant settings updated successfully')
      },
      onError: (error) => {
        toast.error('Failed to update restaurant settings')
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
        email: restaurant.email || '',
        imageUrl: restaurant.imageUrl || '',
        deliverySettings: {
          baseRate: restaurant.deliverySettings?.baseRate || 10000,
          perKmRate: restaurant.deliverySettings?.perKmRate || 2000,
          estimatedTime: restaurant.deliverySettings?.estimatedTime || '25-35',
          maxDistance: restaurant.deliverySettings?.maxDistance || 10
        },
        operatingHours: restaurant.operatingHours || formData.operatingHours
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

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateRestaurantMutation.mutate(formData)
  }

  const handleCancel = () => {
    if (restaurantData?.data?.restaurant) {
      const restaurant = restaurantData.data.restaurant
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        imageUrl: restaurant.imageUrl || '',
        deliverySettings: {
          baseRate: restaurant.deliverySettings?.baseRate || 10000,
          perKmRate: restaurant.deliverySettings?.perKmRate || 2000,
          estimatedTime: restaurant.deliverySettings?.estimatedTime || '25-35',
          maxDistance: restaurant.deliverySettings?.maxDistance || 10
        },
        operatingHours: restaurant.operatingHours || formData.operatingHours
      })
    }
    setIsEditing(false)
  }

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your restaurant information and delivery settings
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
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateRestaurantMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>
                  {updateRestaurantMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Settings</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
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
                Description
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
                  <span className="text-gray-900">{formData.description || 'No description'}</span>
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
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="input w-full"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.phone || 'No phone number'}</span>
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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input w-full"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <span className="text-gray-900">{formData.email || 'No email'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
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
                  <span className="text-gray-900">{formData.address || 'No address'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Image URL
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  className="input w-full"
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Image className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.imageUrl || 'No image URL'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Truck className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Delivery Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Delivery Rate (VND)
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
                Per Kilometer Rate (VND)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.perKmRate}
                  onChange={(e) => handleChange('deliverySettings.perKmRate', parseInt(e.target.value))}
                  className="input w-full"
                  min="0"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatCurrency(formData.deliverySettings.perKmRate)}/km</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Time
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.deliverySettings.estimatedTime}
                  onChange={(e) => handleChange('deliverySettings.estimatedTime', e.target.value)}
                  className="input w-full"
                  placeholder="e.g., 25-35"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.deliverySettings.estimatedTime} minutes</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Delivery Distance (km)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.deliverySettings.maxDistance}
                  onChange={(e) => handleChange('deliverySettings.maxDistance', parseInt(e.target.value))}
                  className="input w-full"
                  min="1"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formData.deliverySettings.maxDistance} km</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.key} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">
                  {day.label}
                </div>
                
                {isEditing ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!formData.operatingHours[day.key].closed}
                        onChange={(e) => handleOperatingHoursChange(day.key, 'closed', !e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </div>
                    
                    {!formData.operatingHours[day.key].closed && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={formData.operatingHours[day.key].open}
                          onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                          className="input"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={formData.operatingHours[day.key].close}
                          onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                          className="input"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    {formData.operatingHours[day.key].closed ? (
                      <span className="text-red-600">Closed</span>
                    ) : (
                      <span>
                        {formData.operatingHours[day.key].open} - {formData.operatingHours[day.key].close}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}

export default RestaurantSettings