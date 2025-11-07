import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { restaurantService } from '../../services/restaurantService'
import { Search, Clock, MapPin, Filter, Grid, List } from 'lucide-react'

// Filled gold star SVG
const FilledStar = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z" />
  </svg>
)
import { formatCurrency, formatDistance } from '../../utils/formatters'

function Restaurants() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('distance')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search query - minimal delay for smooth UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 100) // 100ms - just enough to prevent too many requests

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch restaurants
  const { data: restaurantsData, isLoading, isFetching } = useQuery(
    ['restaurants', { search: debouncedSearch, category: selectedCategory, sortBy }],
    () => restaurantService.getRestaurants({
      search: debouncedSearch,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      sortBy,
      limit: 20
    }),
    {
      staleTime: 30 * 1000, // 30 seconds
      enabled: true,
      keepPreviousData: true, // Keep old data while fetching new data to prevent flickering
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []

  // Categories
  const categories = [
    { id: 'all', name: 'Tất Cả Danh Mục' },
    { id: 'fastfood', name: 'Đồ Ăn Nhanh' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'dessert', name: 'Tráng Miệng' },
    { id: 'beverages', name: 'Đồ Uống' },
  ]

  // Sort options
  const sortOptions = [
    { value: 'distance', label: 'Gần Nhất' },
    { value: 'deliveryTime', label: 'Giao Nhanh Nhất' },
    { value: 'name', label: 'Tên A-Z' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nhà Hàng</h1>
        <p className="text-gray-600 mt-1">
          Khám phá các nhà hàng giao đồ ăn bằng drone trong khu vực của bạn
        </p>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
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

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input lg:w-48"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Lọc</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh Mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-full"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời Gian Giao
                </label>
                <select className="input w-full">
                  <option value="all">Bất kỳ</option>
                  <option value="fast">Dưới 20 phút</option>
                  <option value="medium">20-30 phút</option>
                  <option value="slow">Trên 30 phút</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng Cách
                </label>
                <select className="input w-full">
                  <option value="all">Bất kỳ</option>
                  <option value="near">Dưới 1km</option>
                  <option value="medium">1-3km</option>
                  <option value="far">Trên 3km</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tất Cả Nhà Hàng'}
          </h2>
          {restaurants.length > 0 && (
            <span className="text-sm text-gray-500">
              Tìm thấy {restaurants.length} nhà hàng
            </span>
          )}
        </div>

        {isLoading ? (
          <RestaurantSkeleton viewMode={viewMode} />
        ) : restaurants.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr' 
            : 'space-y-4'
          }>
            {restaurants.map(restaurant => (
              viewMode === 'grid' ? (
                <RestaurantGridCard key={restaurant._id} restaurant={restaurant} />
              ) : (
                <RestaurantListCard key={restaurant._id} restaurant={restaurant} />
              )
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
                ? `Không có nhà hàng phù hợp với từ khóa "${searchQuery}"`
                : 'Chưa có nhà hàng nào khả dụng'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Xóa Tìm Kiếm
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Restaurant Grid Card Component
function RestaurantGridCard({ restaurant }) {
  // Safe access for restaurant properties
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="h-48 bg-gray-200 overflow-hidden relative">
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

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="pr-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {restaurantName}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {restaurantDescription}
              </p>
            </div>
            <div className="flex flex-col items-end text-right ml-4">
              <div className="flex items-center space-x-2">
                <FilledStar className="h-5 w-5" />
                <span className="text-sm font-semibold text-gray-900">
                  {restaurant?.rating?.average ? restaurant.rating.average.toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {restaurant?.rating?.count ? `${restaurant.rating.count} lượt` : 'Chưa có đánh giá'}
              </div>
            </div>
            <div className="ml-3">
              {isOpen && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Đang mở
                </span>
              )}
            </div>
          </div>

          {/* Distance and ETA removed */}
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Phí giao: {formatCurrency(deliveryFee)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Restaurant List Card Component
function RestaurantListCard({ restaurant }) {
  // Safe access for restaurant properties
  const deliveryFee = restaurant?.deliverySettings?.baseRate || 10000
  const estimatedTime = restaurant?.deliverySettings?.estimatedTime || '25-35'
  const restaurantName = restaurant?.name || 'Nhà hàng'
  const restaurantDescription = restaurant?.description || 'Chưa có mô tả'
  const restaurantImage = restaurant?.imageUrl || '/placeholder-restaurant.jpg'
  const isOpen = restaurant?.isOpen || false

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block"
    >
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="w-32 h-24 bg-gray-200 flex-shrink-0 relative overflow-hidden">
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
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg">
                Đang đóng cửa
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="pr-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {restaurantName}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {restaurantDescription}
              </p>
            </div>
            <div className="flex flex-col items-end text-right ml-4">
              <div className="flex items-center space-x-2">
                <FilledStar className="h-5 w-5" />
                <span className="text-sm font-semibold text-gray-900">
                  {restaurant?.rating?.average ? restaurant.rating.average.toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {restaurant?.rating?.count ? `${restaurant.rating.count} lượt` : 'Chưa có đánh giá'}
              </div>
            </div>
            <div className="ml-3">
              {isOpen && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Đang mở
                </span>
              )}
            </div>
          </div>

          {/* Distance and ETA removed */}
          <div className="flex items-center justify-between">
            <span>Phí giao: {formatCurrency(deliveryFee)}</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              Giao bằng Drone
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Loading Skeleton
function RestaurantSkeleton({ viewMode }) {
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
          <div className="w-32 h-24 bg-gray-200 rounded-lg mr-4"></div>
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

export default Restaurants
