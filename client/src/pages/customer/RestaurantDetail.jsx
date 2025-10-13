import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { useCartStore } from '../../stores/cartStore'
import { 
  Clock, MapPin, Phone, Plus, Minus, 
  ShoppingCart, Heart, Share2, Filter, Grid, List 
} from 'lucide-react'
import { formatCurrency, formatDistance, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, cartRestaurant, restaurantId } = useCartStore()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [isFavorite, setIsFavorite] = useState(false)

  // Fetch restaurant details
  const { data: restaurantData, isLoading: restaurantLoading } = useQuery(
    ['restaurant', id],
    () => restaurantService.getRestaurant(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  )

  // Fetch restaurant menu
  const { data: menuData, isLoading: menuLoading } = useQuery(
    ['restaurant-menu', id, selectedCategory],
    () => restaurantService.getRestaurantMenu(id, {
      category: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  )

  const currentRestaurant = restaurantData?.data?.restaurant
  const menuItems = menuData?.data?.menuItems || []
  const categories = menuData?.data?.categories || ['all']

  // Safe access for restaurant properties
  const restaurantName = currentRestaurant?.name || 'Nhà hàng'
  const restaurantDescription = currentRestaurant?.description || 'Chưa có mô tả'

  // Check if this is the same restaurant as in cart
  const isSameRestaurant = restaurantId === id

  const handleAddToCart = (item) => {
    if (!isSameRestaurant && restaurantId) {
      if (window.confirm('Bạn có món từ nhà hàng khác trong giỏ. Bạn có muốn xóa và thêm món từ nhà hàng này?')) {
        addItem(item, currentRestaurant)
        toast.success(`Đã thêm ${item.name} vào giỏ`)
      }
    } else {
      addItem(item, currentRestaurant)
      toast.success(`Đã thêm ${item.name} vào giỏ`)
    }
  }

  const handleGoToCart = () => {
    navigate('/customer/cart')
  }

  if (restaurantLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentRestaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy nhà hàng</h2>
        <p className="text-gray-600 mb-4">Nhà hàng bạn tìm kiếm không tồn tại.</p>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="btn btn-primary"
        >
          Xem Nhà Hàng
        </button>
      </div>
    )
  }

  const deliveryFee = currentRestaurant.deliverySettings?.baseRate || 10000
  const estimatedTime = currentRestaurant.deliverySettings?.estimatedTime || '25-35'

  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Restaurant Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={currentRestaurant?.imageUrl || '/placeholder-restaurant.jpg'}
            alt={restaurantName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-restaurant.jpg'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Header Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
              } hover:bg-opacity-80 transition-colors`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 bg-white text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {restaurantName}
              </h1>
              <p className="text-gray-600 mb-3">
                {restaurantDescription}
              </p>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>Cách {formatDistance(currentRestaurant.distance || 1500)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>Giao trong {estimatedTime} phút</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-5 w-5" />
              <span>{currentRestaurant.phone || 'Không có SĐT'}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-primary-900">Có Giao Hàng Bằng Drone</h3>
                <p className="text-sm text-primary-700">
                  Phí giao hàng: {formatCurrency(deliveryFee)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-700">
                  Thời gian dự kiến: {estimatedTime} phút
                </p>
                <p className="text-xs text-primary-600">
                  Giao không tiếp xúc
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Menu Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Thực Đơn</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất Cả
            </button>
            {categories.filter(cat => cat !== 'all').map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-6">
          {menuLoading ? (
            <MenuSkeleton viewMode={viewMode} />
          ) : menuItems.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {menuItems.map(item => (
                viewMode === 'grid' ? (
                  <MenuItemGridCard 
                    key={item._id} 
                    item={item} 
                    onAddToCart={handleAddToCart}
                  />
                ) : (
                  <MenuItemListCard 
                    key={item._id} 
                    item={item} 
                    onAddToCart={handleAddToCart}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy món
              </h3>
              <p className="text-gray-500">
                Không có món ăn trong danh mục này.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Summary */}
      <CartSummary onGoToCart={handleGoToCart} />
    </div>
  )
}

// Menu Item Grid Card
function MenuItemGridCard({ item, onAddToCart }) {
  const { getItemQuantity, updateQuantity } = useCartStore()
  const quantity = getItemQuantity(item._id)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        <img
          src={item.imageUrl || '/api/placeholder/400/225'}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <span className="font-bold text-primary-600">
            {formatCurrency(item.price)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>

        {item.weightGrams && (
          <p className="text-xs text-gray-500 mb-3">
            Khối lượng: {item.weightGrams}g
          </p>
        )}

        <div className="flex items-center justify-between">
          {quantity > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item._id, quantity - 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-medium">{quantity}</span>
              <button
                onClick={() => updateQuantity(item._id, quantity + 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="btn btn-primary btn-sm flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Menu Item List Card
function MenuItemListCard({ item, onAddToCart }) {
  const { getItemQuantity, updateQuantity } = useCartStore()
  const quantity = getItemQuantity(item._id)

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
        <img
          src={item.imageUrl || '/api/placeholder/400/225'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <span className="font-bold text-primary-600">
            {formatCurrency(item.price)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {item.weightGrams && <span>Khối lượng: {item.weightGrams}g</span>}
            {item.prepTime && <span>Chuẩn bị: {item.prepTime}p</span>}
          </div>

          {quantity > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item._id, quantity - 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-medium">{quantity}</span>
              <button
                onClick={() => updateQuantity(item._id, quantity + 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="btn btn-primary btn-sm flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Cart Summary Component
function CartSummary({ onGoToCart }) {
  const { getTotalItems, getTotal, isEmpty } = useCartStore()

  if (isEmpty()) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">
            {getTotalItems()} món trong giỏ
          </p>
          <p className="text-sm text-gray-600">
            Tổng: {formatCurrency(getTotal())}
          </p>
        </div>
        <button
          onClick={onGoToCart}
          className="btn btn-primary flex items-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Xem Giỏ</span>
        </button>
      </div>
    </div>
  )
}

// Loading Skeleton
function MenuSkeleton({ viewMode }) {
  const skeletonItems = [...Array(6)]
  
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletonItems.map((_, i) => (
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
    )
  }

  return (
    <div className="space-y-4">
      {skeletonItems.map((_, i) => (
        <div key={i} className="flex animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-lg mr-4"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RestaurantDetail

