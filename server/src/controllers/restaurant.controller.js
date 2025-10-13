const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { calculateDistance, findRestaurantsInRange } = require('../utils/geo');
const logger = require('../utils/logger');

// Get restaurants (public)
const getRestaurants = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      lat, 
      lng, 
      radius = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    let query = { active: true, approved: true };
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category (if menu items have categories)
    if (category) {
      const restaurantsWithCategory = await MenuItem.distinct('restaurantId', { 
        category: new RegExp(category, 'i'),
        available: true
      });
      query._id = { $in: restaurantsWithCategory };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'rating') {
      sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'distance' && lat && lng) {
      // For distance sorting, we'll sort after fetching
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // If location provided, find nearby restaurants
    if (lat && lng) {
      const restaurants = await Restaurant.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
          }
        }
      })
      .populate('ownerUserId', 'name phone')
      .sort(sort)
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Restaurant.countDocuments({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000
          }
        }
      });

      // Add distance to each restaurant
      const restaurantsWithDistance = restaurants.map(restaurant => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          restaurant.location.coordinates[1], // latitude
          restaurant.location.coordinates[0]  // longitude
        );
        
        return {
          ...restaurant.toObject(),
          distance: Math.round(distance * 100) / 100
        };
      });

      // Sort by distance if requested
      if (sortBy === 'distance') {
        restaurantsWithDistance.sort((a, b) => {
          return sortOrder === 'desc' ? b.distance - a.distance : a.distance - b.distance;
        });
      }

      res.json({
        success: true,
        data: {
          restaurants: restaurantsWithDistance,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } else {
      // No location provided, regular query
      const restaurants = await Restaurant.find(query)
        .populate('ownerUserId', 'name phone')
        .sort(sort)
        .limit(parseInt(limit) * 1)
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Restaurant.countDocuments(query);

      res.json({
        success: true,
        data: {
          restaurants,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    }

  } catch (error) {
    logger.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants'
    });
  }
};

// Get current user's restaurant (for restaurant owners)
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ 
      ownerUserId: req.user._id
    })
    .populate('ownerUserId', 'name phone email');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found. Please create a restaurant first.'
      });
    }

    res.json({
      success: true,
      data: {
        restaurant
      }
    });

  } catch (error) {
    logger.error('Get my restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant'
    });
  }
};

// Update current user's restaurant (for restaurant owners)
const updateMyRestaurant = async (req, res) => {
  try {
    const updateData = req.body;

    // Find restaurant owned by current user
    const restaurant = await Restaurant.findOne({ 
      ownerUserId: req.user._id
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found. Please create a restaurant first.'
      });
    }

    // Update restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`My restaurant updated: ${updatedRestaurant.name}`);

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: {
        restaurant: updatedRestaurant
      }
    });

  } catch (error) {
    logger.error('Update my restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant'
    });
  }
};

// Get single restaurant
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      active: true, 
      approved: true 
    })
    .populate('ownerUserId', 'name phone email');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Get menu categories
    const categories = await MenuItem.distinct('category', { 
      restaurantId: id, 
      available: true 
    });

    // Get popular items
    const popularItems = await MenuItem.findPopular(id, 5);

    res.json({
      success: true,
      data: {
        restaurant,
        categories,
        popularItems
      }
    });

  } catch (error) {
    logger.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant'
    });
  }
};

// Get restaurant menu
const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, featured, minPrice, maxPrice, search } = req.query;

    // Check if restaurant exists
    const restaurant = await Restaurant.findOne({ 
      _id: id
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    const menuItems = await MenuItem.findByRestaurant(id, {
      category,
      featured: featured === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    });

    // Search in menu items if search term provided
    let filteredItems = menuItems;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
    }

    // Get categories
    const categories = await MenuItem.distinct('category', { 
      restaurantId: id, 
      available: true 
    });

    res.json({
      success: true,
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          imageUrl: restaurant.imageUrl,
          rating: restaurant.rating,
          active: restaurant.active,
          approved: restaurant.approved,
          deliverySettings: restaurant.deliverySettings
        },
        menuItems: filteredItems,
        categories
      }
    });

  } catch (error) {
    logger.error('Get restaurant menu error:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant menu'
    });
  }
};

// Create restaurant (restaurant owner only)
const createRestaurant = async (req, res) => {
  try {
    const { name, address, location, momo } = req.body;

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerUserId: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        error: 'You already have a restaurant'
      });
    }

    const restaurant = new Restaurant({
      ownerUserId: req.user._id,
      name,
      address,
      location,
      momo,
      active: false, // Needs admin approval
      approved: false
    });

    await restaurant.save();

    // Update user's restaurantId
    req.user.restaurantId = restaurant._id;
    await req.user.save();

    logger.info(`New restaurant created: ${restaurant.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully. Waiting for admin approval.',
      data: {
        restaurant
      }
    });

  } catch (error) {
    logger.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restaurant'
    });
  }
};


// Create menu item (for restaurant owners)
const createMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    // Check if restaurant belongs to user
    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      ownerUserId: req.user._id 
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or you do not have permission to access it'
      });
    }

    // Add restaurant ID to item data
    itemData.restaurantId = id;

    const menuItem = new MenuItem(itemData);
    await menuItem.save();

    logger.info(`Menu item created: ${menuItem.name} for restaurant ${restaurant.name}`);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: {
        menuItem
      }
    });

  } catch (error) {
    logger.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item'
    });
  }
};

// Update menu item (for restaurant owners)
const updateMenuItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const updateData = req.body;

    // Check if restaurant belongs to user
    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      ownerUserId: req.user._id 
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or you do not have permission to access it'
      });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: itemId, restaurantId: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    logger.info(`Menu item updated: ${menuItem.name} for restaurant ${restaurant.name}`);

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        menuItem
      }
    });

  } catch (error) {
    logger.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item'
    });
  }
};

// Delete menu item (for restaurant owners)
const deleteMenuItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    // Check if restaurant belongs to user
    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      ownerUserId: req.user._id 
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or you do not have permission to access it'
      });
    }

    const menuItem = await MenuItem.findOneAndDelete({ 
      _id: itemId, 
      restaurantId: id 
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    logger.info(`Menu item deleted: ${menuItem.name} for restaurant ${restaurant.name}`);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    logger.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item'
    });
  }
};

// Update restaurant (restaurant owner only)
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if restaurant belongs to user
    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      ownerUserId: req.user._id 
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or access denied'
      });
    }

    // Update restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Restaurant updated: ${updatedRestaurant.name}`);

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: {
        restaurant: updatedRestaurant
      }
    });

  } catch (error) {
    logger.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant'
    });
  }
};

// Get restaurant statistics (restaurant owner only)
const getRestaurantStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateFrom, dateTo } = req.query;

    // Check if restaurant belongs to user
    const restaurant = await Restaurant.findOne({ 
      _id: id, 
      ownerUserId: req.user._id 
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or access denied'
      });
    }

    // Get order statistics
    const orderStats = await Order.getStatistics(id, dateFrom, dateTo);
    
    // Get menu item statistics
    const menuItemStats = await MenuItem.aggregate([
      { $match: { restaurantId: restaurant._id } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] }
          },
          featuredItems: {
            $sum: { $cond: [{ $eq: ['$featured', true] }, 1, 0] }
          },
          averagePrice: { $avg: '$price' },
          totalOrders: { $sum: '$popularity.orderCount' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.findByRestaurant(id, { limit: 10 })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          rating: restaurant.rating,
          stats: restaurant.stats,
          isOpen: restaurant.isOpen()
        },
        orderStats: orderStats[0] || {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          completionRate: 0
        },
        menuItemStats: menuItemStats[0] || {
          totalItems: 0,
          availableItems: 0,
          featuredItems: 0,
          averagePrice: 0,
          totalOrders: 0
        },
        recentOrders
      }
    });

  } catch (error) {
    logger.error('Get restaurant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant statistics'
    });
  }
};

// Get pending restaurants (Admin only)
const getPendingRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const restaurants = await Restaurant.findPendingApproval()
      .populate('ownerUserId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Restaurant.countDocuments({ approved: false });

    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get pending restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending restaurants'
    });
  }
};

// Approve restaurant (Admin only)
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    if (restaurant.approved) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is already approved'
      });
    }

    restaurant.approved = true;
    restaurant.active = true;
    restaurant.approvedBy = req.user._id;
    restaurant.approvedAt = new Date();

    await restaurant.save();

    logger.info(`Restaurant approved: ${restaurant.name} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Restaurant approved successfully',
      data: {
        restaurant
      }
    });

  } catch (error) {
    logger.error('Approve restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve restaurant'
    });
  }
};

// Reject restaurant (Admin only)
const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    if (restaurant.approved) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is already approved'
      });
    }

    // Mark as rejected (you might want to add a rejected field to the schema)
    restaurant.active = false;
    await restaurant.save();

    logger.info(`Restaurant rejected: ${restaurant.name} by admin ${req.user.email}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Restaurant rejected successfully'
    });

  } catch (error) {
    logger.error('Reject restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject restaurant'
    });
  }
};


module.exports = {
  getRestaurants,
  getRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  getRestaurantMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createRestaurant,
  updateRestaurant,
  getRestaurantStats,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant
};

