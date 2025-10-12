import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search, Filter,
  Image, DollarSign, Package, Clock, Save, X
} from 'lucide-react'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'
import ImageUpload from '../../components/ImageUpload'

function RestaurantMenu() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const queryClient = useQueryClient()

  // Fetch menu items
  const { data: menuData, isLoading } = useQuery(
    ['restaurant-menu', { search: searchQuery, category: categoryFilter }],
    async () => {
      const res = await restaurantService.getMyRestaurant()
      if (!res?.data?.restaurant?._id) {
        throw new Error('Restaurant not found')
      }
      return restaurantService.getRestaurantMenu(res.data.restaurant._id, {
        search: searchQuery,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Create menu item mutation
  const createItemMutation = useMutation(
    async (itemData) => {
      const restaurant = await restaurantService.getMyRestaurant()
      if (!restaurant?.data?.restaurant?._id) {
        throw new Error('Restaurant not found')
      }
      return restaurantService.createMenuItem(restaurant.data.restaurant._id, itemData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-menu'])
        setShowAddModal(false)
        toast.success('Tạo món ăn thành công')
      },
      onError: (error) => {
        toast.error('Không thể tạo món ăn')
      }
    }
  )

  // Update menu item mutation
  const updateItemMutation = useMutation(
    async ({ itemId, itemData }) => {
      const restaurant = await restaurantService.getMyRestaurant()
      return restaurantService.updateMenuItem(restaurant.restaurant._id, itemId, itemData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-menu'])
        setEditingItem(null)
        toast.success('Cập nhật món ăn thành công')
      },
      onError: (error) => {
        toast.error('Không thể cập nhật món ăn')
      }
    }
  )

  // Delete menu item mutation
  const deleteItemMutation = useMutation(
    async (itemId) => {
      const restaurant = await restaurantService.getMyRestaurant()
      return restaurantService.deleteMenuItem(restaurant.restaurant._id, itemId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['restaurant-menu'])
        toast.success('Xóa món ăn thành công')
      },
      onError: (error) => {
        toast.error('Không thể xóa món ăn')
      }
    }
  )

  const menuItems = menuData?.data?.menuItems || []
  const categories = menuData?.data?.categories || ['all']
  
  // Debug: Check data structure
  console.log('Menu data:', menuData)
  console.log('Menu items:', menuItems)

  const handleDeleteItem = (itemId, itemName) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${itemName}"?`)) {
      deleteItemMutation.mutate(itemId)
    }
  }

  const handleToggleAvailability = (item) => {
    updateItemMutation.mutate({
      itemId: item._id,
      itemData: { available: !item.available }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Thực Đơn</h1>
          <p className="text-gray-600 mt-1">
            Quản lý món ăn và giá cả của nhà hàng
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Món Ăn</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="all">Tất Cả Danh Mục</option>
            {categories.filter(cat => cat !== 'all').map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select className="input lg:w-48">
            <option value="all">Tất Cả Món</option>
            <option value="available">Còn Hàng</option>
            <option value="unavailable">Hết Hàng</option>
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : menuItems.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDeleteItem(item._id, item.name)}
                  onToggleAvailability={() => handleToggleAvailability(item)}
                  isDeleting={deleteItemMutation.isLoading}
                  isUpdating={updateItemMutation.isLoading}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy món ăn
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Không có món nào phù hợp với bộ lọc.'
                : 'Bắt đầu bằng cách thêm món ăn đầu tiên.'
              }
            </p>
            {searchQuery || categoryFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
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
                Thêm Món Ăn
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <MenuItemModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSubmit={(data) => {
            if (editingItem) {
              updateItemMutation.mutate({
                itemId: editingItem._id,
                itemData: data
              })
            } else {
              createItemMutation.mutate(data)
            }
          }}
          isLoading={createItemMutation.isLoading || updateItemMutation.isLoading}
        />
      )}
    </div>
  )
}

// Menu Item Card Component
function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability, isDeleting, isUpdating }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Item Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div 
          className="w-full h-48 bg-gray-200 flex items-center justify-center"
          style={{display: item.imageUrl ? 'none' : 'flex'}}
        >
          <div className="text-center">
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-500">Chưa có ảnh</span>
          </div>
        </div>
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Hết Hàng
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onToggleAvailability()}
            disabled={isUpdating}
            className={`p-1 rounded-full ${
              item.available 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-red-500 text-white hover:bg-red-600'
            } transition-colors`}
          >
            {item.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Item Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          <span className="font-bold text-primary-600 ml-2">
            {formatCurrency(item.price)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Item Details */}
        <div className="space-y-2 text-xs text-gray-500 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>Khối lượng: {formatWeight(item.weightGrams || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Chuẩn bị: {item.prepTime || 0}p</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>Danh mục: {item.category || 'Chưa phân loại'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
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
          
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.available 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {item.available ? 'Còn Hàng' : 'Hết Hàng'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Menu Item Modal Component
function MenuItemModal({ item, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || '',
    weightGrams: item?.weightGrams || 0,
    prepTime: item?.prepTime || 0,
    available: item?.available !== false,
    imageUrl: item?.imageUrl || '',
    allergens: item?.allergens || [],
    nutritionalInfo: item?.nutritionalInfo || {}
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const categories = [
    'Khai Vị', 'Món Chính', 'Tráng Miệng', 'Đồ Uống', 
    'Đồ Ăn Nhanh', 'Ăn Kiêng', 'Món Á', 'Món Ý'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {item ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên Món *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input w-full"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá (VND) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', parseInt(e.target.value))}
                className="input w-full"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh Mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="input w-full"
              >
                <option value="">Chọn Danh Mục</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khối Lượng (gram)
              </label>
              <input
                type="number"
                value={formData.weightGrams}
                onChange={(e) => handleChange('weightGrams', parseInt(e.target.value))}
                className="input w-full"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời Gian Chuẩn Bị (phút)
              </label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => handleChange('prepTime', parseInt(e.target.value))}
                className="input w-full"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình Ảnh Sản Phẩm <span className="text-gray-500 text-sm">(Tùy chọn)</span>
              </label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(value) => handleChange('imageUrl', value)}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => handleChange('available', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Còn hàng để đặt
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-md"
              disabled={isLoading}
            >
              {t('Hủy')}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {item ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {item ? 'Cập Nhật' : 'Tạo Món'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RestaurantMenu