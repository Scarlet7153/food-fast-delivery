const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// Get menu items by restaurant
const getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, featured, minPrice, maxPrice, search } = req.query;
    
    // Check if restaurant exists and is active
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    // If not admin/owner, only show if active and approved
    if (req.user?.role !== 'admin' && req.user?.role !== 'restaurant') {
      if (!restaurant.active || !restaurant.approved) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found or not active'
        });
      }
    }
    
    const options = {
      category,
      featured: featured === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    };
    
    let menuItems;
    
    if (search) {
      menuItems = await MenuItem.search(search, { restaurantId, ...options });
    } else {
      menuItems = await MenuItem.findByRestaurant(restaurantId, options);
    }
    
    res.json({
      success: true,
      data: {
        menuItems,
        restaurant: {
          name: restaurant.name,
          isOpen: restaurant.isOpen()
        }
      }
    });
    
  } catch (error) {
    logger.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get menu items'
    });
  }
};

// Get my menu items (Restaurant owner)
const getMyMenuItems = async (req, res) => {
  try {
    const { category, featured, minPrice, maxPrice, search } = req.query;
    const userId = req.user._id || req.user.userId;
    
    // Find restaurant by owner
    const restaurant = await Restaurant.findOne({ ownerUserId: userId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found for this user'
      });
    }
    
    const options = {
      category,
      featured: featured === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    };
    
    let menuItems;
    
    if (search) {
      menuItems = await MenuItem.search(search, { restaurantId: restaurant._id, ...options });
    } else {
      menuItems = await MenuItem.findByRestaurant(restaurant._id, options);
    }
    
    res.json({
      success: true,
      data: {
        menuItems,
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          isOpen: restaurant.isOpen()
        }
      }
    });
    
  } catch (error) {
    logger.error('Get my menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get menu items'
    });
  }
};

// Get menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findById(id).populate('restaurantId', 'name active approved');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        menuItem
      }
    });
    
  } catch (error) {
    logger.error('Get menu item by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get menu item'
    });
  }
};

// Create menu item
const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItemData = { ...req.body, restaurantId };
    
    // Check if restaurant exists and user owns it
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId, 
      ownerUserId: req.user._id 
    });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or you do not have permission'
      });
    }
    
    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();
    
    logger.info(`New menu item created: ${menuItem.name} for restaurant ${restaurantId}`);
    
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

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const menuItem = await MenuItem.findById(id).populate('restaurantId', 'ownerUserId');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    // Check if user owns the restaurant
    if (menuItem.restaurantId.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this menu item'
      });
    }
    
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Menu item updated: ${updatedMenuItem.name}`);
    
    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        menuItem: updatedMenuItem
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

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findById(id).populate('restaurantId', 'ownerUserId');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    // Check if user owns the restaurant
    if (menuItem.restaurantId.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this menu item'
      });
    }
    
    await MenuItem.findByIdAndDelete(id);
    
    logger.info(`Menu item deleted: ${menuItem.name}`);
    
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

// Update menu item stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const menuItem = await MenuItem.findById(id).populate('restaurantId', 'ownerUserId');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    // Check if user owns the restaurant
    if (menuItem.restaurantId.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this menu item'
      });
    }
    
    await menuItem.updateStock(quantity);
    
    logger.info(`Menu item stock updated: ${menuItem.name} by ${quantity}`);
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        menuItem
      }
    });
    
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
};

// Get popular menu items
const getPopularMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 10 } = req.query;
    
    const menuItems = await MenuItem.findPopular(restaurantId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        menuItems
      }
    });
    
  } catch (error) {
    logger.error('Get popular menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular menu items'
    });
  }
};

// Update menu item rating
const updateMenuItemRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    
    await menuItem.updateRating(rating);
    
    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        menuItem
      }
    });
    
  } catch (error) {
    logger.error('Update menu item rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update rating'
    });
  }
};

// Search menu items across all restaurants
const searchMenuItems = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, featured, page = 1, limit = 20 } = req.query;
    
    // Allow search without any filters to get all items
    // if (!search && !category && !featured) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Search term, category, or featured filter is required'
    //   });
    // }
    
    const options = {
      category,
      featured: featured === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    let menuItems;
    
    if (search) {
      // Use text search when search term is provided
      menuItems = await MenuItem.search(search, options);
    } else {
      // When no search term, find by category, featured, and other filters across all restaurants
      const query = { available: true };
      
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.featured) {
        query.featured = options.featured;
      }
      
      if (options.minPrice || options.maxPrice) {
        query.price = {};
        if (options.minPrice) query.price.$gte = options.minPrice;
        if (options.maxPrice) query.price.$lte = options.maxPrice;
      }
      
      // Only get items from active and approved restaurants
      const activeRestaurants = await Restaurant.find({ active: true, approved: true }).select('_id');
      const restaurantIds = activeRestaurants.map(r => r._id);
      query.restaurantId = { $in: restaurantIds };
      
      menuItems = await MenuItem.find(query)
        .populate('restaurantId', 'name active approved')
        .sort({ featured: -1, 'popularity.rating.average': -1, name: 1 })
        .limit(options.limit);
    }
    
    res.json({
      success: true,
      data: {
        menuItems,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: menuItems.length
        }
      }
    });
    
  } catch (error) {
    logger.error('Search menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search menu items'
    });
  }
};

module.exports = {
  getMenuItems,
  getMyMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateStock,
  getPopularMenuItems,
  updateMenuItemRating,
  searchMenuItems
};
