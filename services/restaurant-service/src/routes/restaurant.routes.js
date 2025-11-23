const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const restaurantController = require('../controllers/restaurant.controller');
const menuController = require('../controllers/menu.controller');

// Protected routes (Restaurant owners) - MUST BE FIRST to avoid conflicts with /:id
router.get('/me', auth, requireRole('restaurant'), restaurantController.getMyRestaurant);
router.put('/me', auth, requireRole('restaurant'), validate(schemas.updateRestaurant), restaurantController.updateMyRestaurant);
router.get('/me/menu', auth, requireRole('restaurant'), menuController.getMyMenuItems);
router.post('/me/toggle-status', auth, requireRole('restaurant'), restaurantController.toggleRestaurantStatus);

// Public routes
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/owner/:ownerId', restaurantController.getRestaurantByOwner);
router.get('/:id/delivery-fee', validate(schemas.calculateDeliveryFee), restaurantController.calculateDeliveryFee);
router.get('/:restaurantId/menu', menuController.getMenuItems);
router.get('/menu/item/:id', menuController.getMenuItemById);
router.get('/:restaurantId/menu/popular', menuController.getPopularMenuItems);
router.get('/menu/search', menuController.searchMenuItems);

// Protected routes (Restaurant owners) - continued
// Creating a restaurant requires authentication so ownerUserId can be derived from the token
router.post('/', auth, requireRole('restaurant'), validate(schemas.createRestaurant), restaurantController.createRestaurant);
router.put('/:id', auth, requireRole('restaurant'), validate(schemas.updateRestaurant), restaurantController.updateRestaurant);
router.post('/:restaurantId/menu', auth, requireRole('restaurant'), validate(schemas.createMenuItem), menuController.createMenuItem);
router.put('/menu/:id', auth, requireRole('restaurant'), validate(schemas.updateMenuItem), menuController.updateMenuItem);
router.delete('/menu/:id', auth, requireRole('restaurant'), menuController.deleteMenuItem);
router.patch('/menu/:id/stock', auth, requireRole('restaurant'), validate(schemas.updateStock), menuController.updateStock);

// Admin only routes
router.get('/admin/restaurants', auth, requireRole('admin'), restaurantController.getAllRestaurants);
router.get('/admin/restaurants/pending', auth, requireRole('admin'), restaurantController.getPendingRestaurants);
router.patch('/:id/approve', auth, requireRole('admin'), validate(schemas.approveRestaurant), restaurantController.approveRestaurant);

// Rating routes (Authenticated users)
router.post('/:id/rating', auth, validate(schemas.updateRating), restaurantController.updateRating);
router.post('/menu/:id/rating', auth, validate(schemas.updateMenuItemRating), menuController.updateMenuItemRating);

module.exports = router;
