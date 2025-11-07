import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import Pagination from '../../components/common/Pagination'
import { Search, Clock, MapPin, ShoppingCart } from 'lucide-react'

// Filled gold star SVG
const FilledStar = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z" />
  </svg>
)
import { formatCurrency, formatDistance, removeVietnameseAccents } from '../../utils/formatters'
import toast from 'react-hot-toast'

function CustomerHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addItem, cartRestaurant, restaurantId } = useCartStore()
  
  // Normalize search query (remove Vietnamese accents)
  const normalizedSearch = removeVietnameseAccents(searchQuery)

  // Fetch restaurants - realtime search without debounce
  const { data: restaurantsData, isLoading, isFetching } = useQuery(
    ['restaurants', { search: normalizedSearch, page: currentPage }],
    () => restaurantService.getRestaurants({
      search: normalizedSearch || undefined,
      page: currentPage,
      limit: pageSize
    }),
    {
      keepPreviousData: true, // Keep old data while fetching new data to prevent flickering
      staleTime: 30 * 1000, // 30 seconds
      enabled: true
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
      keepPreviousData: true, // Keep old data while fetching new data to prevent flickering
      staleTime: 30 * 1000, // 30 seconds
      enabled: true
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []
  // Exclude menu items from restaurants that are closed
  const rawMenuItems = menuItemsData?.data?.menuItems || []
  const menuItems = rawMenuItems.filter(mi => {
    const rest = mi?.restaurantId || {}
    return rest.isOpen !== false // include when true or undefined
  })
  const totalRestaurants = restaurantsData?.data?.pagination?.total || restaurantsData?.data?.total || 0
  const totalPages = Math.ceil(totalRestaurants / pageSize)

  // Handle add to cart
  const handleAddToCart = (item) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm món vào giỏ hàng')
      // Redirect user to login and return them to the cart after successful login
      navigate('/login', { state: { from: '/customer/cart' } })
      return
    }

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
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {restaurants.filter(r => r.isOpen === true).map(restaurant => (
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

      {/* Pagination for Restaurants */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRestaurants}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

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
    <div className="group h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
        {/* Menu Item Image */}
        <Link to={`/customer/restaurants/${restaurant._id}`} className="block">
          <div className="h-40 bg-gray-200 relative">
            <img
              src={itemImage}
              alt={itemName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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
  <div className="p-3 flex flex-col flex-1 overflow-hidden">
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

          <div className="mt-auto">
            {item?.category && (
              <div className="mb-2">
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {item.category}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
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
          </div>
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
  const isOpen = restaurant?.isOpen || false

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block h-full"
    >
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${!isOpen ? 'opacity-75' : ''}`}>
        {/* Restaurant Image */}
        <div className="h-48 bg-gray-200 relative">
          <img
            src={restaurantImage}
            alt={restaurantName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.src = '/placeholder-restaurant.jpg'
            }}
          />
          {!isOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg">
                Đang đóng cửa
              </span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {restaurantName}
            </h3>
            <div className="inline-flex items-center gap-3">
              <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                <FilledStar className="h-4 w-4" />
                <span className="font-medium">{restaurant?.rating?.average ? restaurant.rating.average.toFixed(1) : '—'}</span>
                <span className="text-xs text-slate-500">({restaurant?.rating?.count ?? 0})</span>
              </div>
              {isOpen && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Đang mở
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurantDescription}
          </p>

          {/* Distance and ETA removed as requested */}

          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Phí giao: {formatCurrency(deliveryFee)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CustomerHome
