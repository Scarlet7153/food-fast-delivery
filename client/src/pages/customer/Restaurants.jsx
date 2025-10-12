import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { restaurantService } from '../../services/restaurantService'
import { Search, Star, Clock, MapPin, Filter, Grid, List } from 'lucide-react'
import { formatCurrency, formatDistance } from '../../utils/formatters'

function Restaurants() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch restaurants
  const { data: restaurantsData, isLoading } = useQuery(
    ['restaurants', { search: searchQuery, category: selectedCategory, sortBy }],
    () => restaurantService.getRestaurants({
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      sortBy,
      limit: 20
    }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const restaurants = restaurantsData?.data?.restaurants || []

  // Categories
  const categories = [
    { id: 'all', name: 'Tất Cả Danh Mục' },
    { id: 'fastfood', name: 'Fast Food' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'asian', name: 'Asian Cuisine' },
    { id: 'healthy', name: 'Healthy Food' },
    { id: 'dessert', name: 'Desserts' },
    { id: 'beverages', name: 'Beverages' },
  ]

  // Sort options
  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'deliveryTime', label: 'Fastest Delivery' },
    { value: 'name', label: 'Name A-Z' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nhà hàng</h1>
        <p className="text-gray-600 mt-1">
          Discover restaurants offering drone delivery in your area
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
              className="input pl-10 w-full"
            />
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
                  Category
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
                  Delivery Time
                </label>
                <select className="input w-full">
                  <option value="all">Any time</option>
                  <option value="fast">Under 20 min</option>
                  <option value="medium">20-30 min</option>
                  <option value="slow">30+ min</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance
                </label>
                <select className="input w-full">
                  <option value="all">Any distance</option>
                  <option value="near">Under 1km</option>
                  <option value="medium">1-3km</option>
                  <option value="far">3km+</option>
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
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Restaurants'}
          </h2>
          {restaurants.length > 0 && (
            <span className="text-sm text-gray-500">
              {restaurants.length} restaurants found
            </span>
          )}
        </div>

        {isLoading ? (
          <RestaurantSkeleton viewMode={viewMode} />
        ) : restaurants.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
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
              No restaurants found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? `No restaurants match your search "${searchQuery}"`
                : 'No restaurants available at the moment'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Clear Search
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
  const deliveryFee = restaurant.deliverySettings?.baseRate || 10000
  const estimatedTime = restaurant.deliverySettings?.estimatedTime || '25-35'

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          <img
            src={restaurant.imageUrl || '/api/placeholder/400/225'}
            alt={restaurant.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

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
              Delivery: {formatCurrency(deliveryFee)}
            </span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              Drone Delivery
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Restaurant List Card Component
function RestaurantListCard({ restaurant }) {
  const deliveryFee = restaurant.deliverySettings?.baseRate || 10000
  const estimatedTime = restaurant.deliverySettings?.estimatedTime || '25-35'

  return (
    <Link
      to={`/customer/restaurants/${restaurant._id}`}
      className="group block"
    >
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="w-32 h-24 bg-gray-200 flex-shrink-0">
          <img
            src={restaurant.imageUrl || '/api/placeholder/400/225'}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        <div className="flex-1 p-4">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{formatDistance(restaurant.distance || 1500)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{estimatedTime} min</span>
              </div>
              <span>Delivery: {formatCurrency(deliveryFee)}</span>
            </div>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              Drone Delivery
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
