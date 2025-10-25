import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { useCartStore } from '../../stores/cartStore'
import { Search, Clock, MapPin, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatDistance, removeVietnameseAccents } from '../../utils/formatters'
import toast from 'react-hot-toast'

function CustomerHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { addItem, cartRestaurant, restaurantId } = useCartStore()
  
  // Normalize search query (remove Vietnamese accents)
  const normalizedSearch = removeVietnameseAccents(searchQuery)

  // Fetch restaurants - realtime search without debounce
  const { data: restaurantsData, isLoading, isFetching } = useQuery(
    ['restaurants', { search: normalizedSearch }],
    () => restaurantService.getRestaurants({
      search: normalizedSearch || undefined,
      limit: 12
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      enabled: true,
      keepPreviousData: true, // Keep old data while fetching new data to prevent flickering
    }
  )

  // Fetch all menu items - realtime search without debounce
  const { data: menuItemsData, isLoading: isLoadingMenuItems, isFetching: isFetchingMenuItems } = useQuery(
    ['menuItems', { search: normalizedSearch }],
    () => restaurantService.searchMenuItems({
      search: normalizedSearch || undefined,
      limit: 12
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      enabled: true,
      keepPreviousData: true, // Keep old data while fetching new data to prevent flickering
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []
  const menuItems = menuItemsData?.data?.menuItems || []

  // Handle add to cart
  const handleAddToCart = (item) => {
    const restaurant = item.restaurantId
    if (!restaurant) {
      toast.error('Không tìm thấy thông tin nhà hàng')
      return
    }

    // Check if cart has items from different restaurant
    if (restaurantId && restaurantId !== restaurant._id) {
      if (window.confirm('Bạn có món từ nhà hàng khác trong giỏ. Bạn có muốn xóa và thêm món từ nhà hàng này?')) {
        addItem(item, restaurant)
        // Cart store will show toast notification
      }
    } else {
      addItem(item, restaurant)
      // Cart store will show toast notification
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà hàng, món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 pr-10 w-full"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="loading-spinner h-5 w-5"></div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {searchQuery ? '🍽️ Món Ăn Tìm Thấy' : '🍽️ Món Ăn Nổi Bật'}
          </h2>
          {menuItems.length > 0 && (
            <span className="text-sm text-gray-500">
              {menuItems.length} món
            </span>
          )}
        </div>

        {isLoadingMenuItems ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-40 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : menuItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.map(item => (
              <MenuItemCard 
                key={item._id} 
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy món ăn
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? `Không có món ăn nào phù hợp với từ khóa "${searchQuery}"`
                : 'Chưa có món ăn nào khả dụng'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Restaurants Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {searchQuery ? 'Nhà Hàng Tìm Thấy' : 'Nhà Hàng Nổi Bật'}
          </h2>
          {restaurants.length > 0 && (
            <span className="text-sm text-gray-500">
              {restaurants.length} nhà hàng
            </span>
          )}
        </div>

        {isLoading ? (
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
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy nhà hàng
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? `Không có nhà hàng nào phù hợp với từ khóa "${searchQuery}"`
                : 'Chưa có nhà hàng nào khả dụng'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// Menu Item Card Component
function MenuItemCard({ item, onAddToCart }) {
  const restaurant = item?.restaurantId || {}
  const itemName = item?.name || 'Món ăn'
  const itemDescription = item?.description || 'Chưa có mô tả'
  const itemImage = item?.imageUrl || '/placeholder-food.jpg'
  const itemPrice = item?.price || 0
  const originalPrice = item?.originalPrice
  const restaurantName = restaurant?.name || 'Nhà hàng'

  const handleAddToCartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart(item)
  }

  return (
    <div className="group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Menu Item Image */}
        <Link to={`/customer/restaurants/${restaurant._id}`} className="block">
          <div className="aspect-w-1 aspect-h-1 bg-gray-200 relative">
            <img
              src={itemImage}
              alt={itemName}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.target.src = '/placeholder-food.jpg'
              }}
            />
            {item?.featured && (
              <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                Nổi bật
              </span>
            )}
          </div>
        </Link>

        {/* Menu Item Info */}
        <div className="p-3">
          <Link to={`/customer/restaurants/${restaurant._id}`} className="block">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1 line-clamp-1">
              {itemName}
            </h3>
            
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {restaurantName}
            </p>

            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {itemDescription}
            </p>
          </Link>

          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-semibold text-primary-600">
                {formatCurrency(itemPrice)}
              </span>
              {originalPrice && originalPrice > itemPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCartClick}
              className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>

          {item?.category && (
            <div>
              <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {item.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Restaurant Card Component
function RestaurantCard({ restaurant }) {
  // Safely access nested properties with fallbacks
  const deliveryFee = restaurant?.deliverySettings?.baseRate || 10000
  const estimatedTime = restaurant?.deliverySettings?.estimatedTime || '25-35'
  const restaurantName = restaurant?.name || 'Nhà hàng'
  const restaurantDescription = restaurant?.description || 'Chưa có mô tả'
  const restaurantImage = restaurant?.imageUrl || '/placeholder-restaurant.jpg'

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Restaurant Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          <img
            src={restaurantImage}
            alt={restaurantName}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.src = '/placeholder-restaurant.jpg'
            }}
          />
        </div>

        {/* Restaurant Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
            {restaurantName}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurantDescription}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{formatDistance(restaurant?.distance || 1500)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime} phút</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Phí giao: {formatCurrency(deliveryFee)}
            </span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              Giao bằng Drone
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CustomerHome
