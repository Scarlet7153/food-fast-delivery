const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// Create menu item
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, weightGrams, prepTimeMinutes, nutrition, allergens, dietary, tags } = req.body;

    // Check if user has a restaurant
    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to create menu items'
      });
    }

    // Check if restaurant is approved
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant || !restaurant.approved) {
      return res.status(400).json({
        success: false,
        error: 'Your restaurant needs to be approved to add menu items'
      });
    }

    const menuItem = new MenuItem({
      restaurantId: req.user.restaurantId,
      name,
      description,
      price,
      originalPrice,
      category,
      weightGrams,
      prepTimeMinutes,
      nutrition,
      allergens,
      dietary,
      tags,
      searchKeywords: [name.toLowerCase(), ...(tags || []).map(tag => tag.toLowerCase())]
    });

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

// Get menu items
const getMenuItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      available, 
      featured, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view menu items'
      });
    }

    const query = { restaurantId: req.user.restaurantId };
    
    if (category) query.category = category;
    if (available !== undefined) query.available = available === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    if (sortBy === 'popularity') {
      sort['popularity.rating.average'] = sortOrder === 'desc' ? -1 : 1;
      sort['popularity.orderCount'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const menuItems = await MenuItem.find(query)
      .sort(sort)
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      data: {
        menuItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

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
    logger.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get menu item'
    });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if menu item belongs to user's restaurant
    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Update search keywords if name or tags changed
    if (updateData.name || updateData.tags) {
      const name = updateData.name || menuItem.name;
      const tags = updateData.tags || menuItem.tags || [];
      updateData.searchKeywords = [name.toLowerCase(), ...tags.map(tag => tag.toLowerCase())];
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

    // Check if menu item belongs to user's restaurant
    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
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

// Update menu item status (available/unavailable)
const updateMenuItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

    // Check if menu item belongs to user's restaurant
    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    menuItem.available = available;
    await menuItem.save();

    logger.info(`Menu item status updated: ${menuItem.name} - ${available ? 'available' : 'unavailable'}`);

    res.json({
      success: true,
      message: `Menu item ${available ? 'made available' : 'made unavailable'}`,
      data: {
        menuItem
      }
    });

  } catch (error) {
    logger.error('Update menu item status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item status'
    });
  }
};

// Update menu item stock
const updateMenuItemStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, trackInventory } = req.body;

    // Check if menu item belongs to user's restaurant
    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: req.user.restaurantId
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    if (trackInventory !== undefined) {
      menuItem.inventory.trackInventory = trackInventory;
    }

    if (stockQuantity !== undefined) {
      menuItem.inventory.stockQuantity = stockQuantity;
      menuItem.inventory.outOfStock = stockQuantity === 0;
    }

    await menuItem.save();

    logger.info(`Menu item stock updated: ${menuItem.name} - ${stockQuantity} units`);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        menuItem
      }
    });

  } catch (error) {
    logger.error('Update menu item stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'You need to have a restaurant to view categories'
      });
    }

    const categories = await MenuItem.distinct('category', { 
      restaurantId: req.user.restaurantId 
    });

    // Get category statistics
    const categoryStats = await MenuItem.aggregate([
      { $match: { restaurantId: req.user.restaurantId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] }
          },
          averagePrice: { $avg: '$price' },
          totalOrders: { $sum: '$popularity.orderCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        categories,
        categoryStats
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemStatus,
  updateMenuItemStock,
  getCategories
};

