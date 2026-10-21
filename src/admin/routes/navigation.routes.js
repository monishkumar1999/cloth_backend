const express = require('express');
const navigationController = require('../controller/navigation.controller');
const {
  validateNavigationIdParam,
  validateCreateNavigationItem,
  validateUpdateNavigationItem,
  validateNavigationStatus
} = require('../validations/navigation.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// Protect all admin navigation routes
router.use(authenticateAdmin, authorizeAdmin);

// GET /api/admin/navigation-items - List all items
router.get('/', (req, res, next) => navigationController.listAdminItems(req, res, next));

// POST /api/admin/navigation-items - Create item
router.post('/', validateCreateNavigationItem, (req, res, next) =>
  navigationController.createItem(req, res, next)
);

// GET /api/admin/navigation-items/:id - Fetch one item
router.get('/:id', validateNavigationIdParam, (req, res, next) =>
  navigationController.getAdminItemById(req, res, next)
);

// PATCH /api/admin/navigation-items/:id - Update item
router.patch('/:id', validateNavigationIdParam, validateUpdateNavigationItem, (req, res, next) =>
  navigationController.updateItem(req, res, next)
);

// PATCH /api/admin/navigation-items/:id/status - Enable/disable item
router.patch('/:id/status', validateNavigationIdParam, validateNavigationStatus, (req, res, next) =>
  navigationController.updateStatus(req, res, next)
);

// DELETE /api/admin/navigation-items/:id - Delete item
router.delete('/:id', validateNavigationIdParam, (req, res, next) =>
  navigationController.deleteItem(req, res, next)
);

module.exports = router;
