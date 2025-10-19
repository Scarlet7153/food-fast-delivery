const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const restaurantController = require('../controllers/restaurant.controller');
const menuController = require('../controllers/menu.controller');

// Public routes
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/owner/:ownerId', restaurantController.getRestaurantByOwner);
router.get('/:id/delivery-fee', validate(schemas.calculateDeliveryFee), restaurantController.calculateDeliveryFee);
router.get('/:restaurantId/menu', menuController.getMenuItems);
router.get('/menu/item/:id', menuController.getMenuItemById);
router.get('/:restaurantId/menu/popular', menuController.getPopularMenuItems);

// Protected routes (Restaurant owners)
router.post('/', auth, requireRole('restaurant'), validate(schemas.createRestaurant), restaurantController.createRestaurant);
router.put('/:id', auth, requireRole('restaurant'), validate(schemas.updateRestaurant), restaurantController.updateRestaurant);
router.post('/:restaurantId/menu', auth, requireRole('restaurant'), validate(schemas.createMenuItem), menuController.createMenuItem);
router.put('/menu/:id', auth, requireRole('restaurant'), validate(schemas.updateMenuItem), menuController.updateMenuItem);
router.delete('/menu/:id', auth, requireRole('restaurant'), menuController.deleteMenuItem);
router.patch('/menu/:id/stock', auth, requireRole('restaurant'), validate(schemas.updateStock), menuController.updateStock);

// Admin only routes
router.get('/admin/pending', auth, requireRole('admin'), restaurantController.getPendingRestaurants);
router.patch('/:id/approve', auth, requireRole('admin'), validate(schemas.approveRestaurant), restaurantController.approveRestaurant);

// Rating routes (Authenticated users)
router.post('/:id/rating', auth, validate(schemas.updateRating), restaurantController.updateRating);
router.post('/menu/:id/rating', auth, validate(schemas.updateMenuItemRating), menuController.updateMenuItemRating);

module.exports = router;
