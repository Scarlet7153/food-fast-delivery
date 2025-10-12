const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const menuController = require('../controllers/menu.controller');

// Restaurant owner routes (protected)
router.post('/', auth, requireRole('restaurant'), validate(schemas.menuItem), menuController.createMenuItem);
router.get('/', auth, requireRole('restaurant'), menuController.getMenuItems);
router.get('/:id', auth, requireRole('restaurant'), menuController.getMenuItem);
router.put('/:id', auth, requireRole('restaurant'), menuController.updateMenuItem);
router.delete('/:id', auth, requireRole('restaurant'), menuController.deleteMenuItem);
router.patch('/:id/status', auth, requireRole('restaurant'), menuController.updateMenuItemStatus);
router.patch('/:id/stock', auth, requireRole('restaurant'), menuController.updateMenuItemStock);

// Categories
router.get('/categories/list', auth, requireRole('restaurant'), menuController.getCategories);

module.exports = router;

