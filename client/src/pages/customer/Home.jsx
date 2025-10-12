import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { restaurantService } from '../../services/restaurantService'
import { Search, Star, Clock, MapPin, Zap, Package } from 'lucide-react'
import { formatCurrency, formatDistance } from '../../utils/formatters'
import { t } from '../../utils/translations'

function CustomerHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch restaurants
  const { data: restaurantsData, isLoading } = useQuery(
    ['restaurants', { search: searchQuery, category: selectedCategory }],
    () => restaurantService.getRestaurants({
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      limit: 12
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'Tất Cả', icon: '🍽️' },
    { id: 'fastfood', name: 'Đồ Ăn Nhanh', icon: '🍔' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'asian', name: 'Món Á', icon: '🍜' },
    { id: 'healthy', name: 'Ăn Kiêng', icon: '🥗' },
    { id: 'dessert', name: 'Tráng Miệng', icon: '🍰' },
    { id: 'beverages', name: 'Đồ Uống', icon: '☕' },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Giao Đồ Ăn Bằng Drone
          </h1>
          <p className="text-xl text-primary-100 mb-6">
            Trải nghiệm tương lai của giao đồ ăn. Giao hàng nhanh chóng, an toàn và hiệu quả với công nghệ drone tiên tiến.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Siêu Nhanh</span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Giao Không Tiếp Xúc</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Chất Lượng Cao Cấp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà hàng, món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Duyệt Theo Danh Mục</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                selectedCategory === category.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Nhà Hàng Nổi Bật'}
          </h2>
          {restaurants.length > 0 && (
            <span className="text-sm text-gray-500">
              Tìm thấy {restaurants.length} nhà hàng
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

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Zap className="h-8 w-8 text-yellow-500" />}
          title="Giao Hàng Siêu Nhanh"
          description="Drone giao đồ ăn trong 15-30 phút, nhanh hơn nhiều so với phương thức giao hàng truyền thống."
        />
        <FeatureCard
          icon={<Package className="h-8 w-8 text-green-500" />}
          title="Không Tiếp Xúc"
          description="Giao hàng an toàn, không tiếp xúc ngay tại cửa nhà với công nghệ drone tiên tiến."
        />
        <FeatureCard
          icon={<Star className="h-8 w-8 text-blue-500" />}
          title="Chất Lượng Cao Cấp"
          description="Đồ ăn được đóng gói cẩn thận và giao trong tình trạng tốt nhất."
        />
      </div>
    </div>
  )
}

// Restaurant Card Component
function RestaurantCard({ restaurant }) {
  const deliveryFee = restaurant.deliverySettings?.baseRate || 10000
  const estimatedTime = restaurant.deliverySettings?.estimatedTime || '25-35'

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Restaurant Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          <img
            src={restaurant.imageUrl || '/api/placeholder/400/225'}
            alt={restaurant.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Restaurant Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {restaurant.rating?.toFixed(1) || '4.5'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{formatDistance(restaurant.distance || 1500)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime} min</span>
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

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm">
        {description}
      </p>
    </div>
  )
}

export default CustomerHome
