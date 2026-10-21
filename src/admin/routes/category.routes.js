const express = require('express');
const categoryController = require('../controller/category.controller');
const {
  validateCategoryIdParam,
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus,
  validateCategoryOrder
} = require('../validations/category.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');
const { uploadCategoryImage } = require('../../middleware/upload.middleware');

const router = express.Router();

// Protect all admin category endpoints
router.use(authenticateAdmin, authorizeAdmin);

// GET /api/admin/categories - List all categories with pagination, search, status filter
router.get('/', (req, res, next) => categoryController.listAdminCategories(req, res, next));

// POST /api/admin/categories - Create category (supports JSON or multipart image upload)
router.post(
  '/',
  uploadCategoryImage,
  validateCreateCategory,
  (req, res, next) => categoryController.createCategory(req, res, next)
);

// GET /api/admin/categories/:id - Fetch single category
router.get('/:id', validateCategoryIdParam, (req, res, next) =>
  categoryController.getAdminCategoryById(req, res, next)
);

// PATCH /api/admin/categories/:id - Update category
router.patch(
  '/:id',
  validateCategoryIdParam,
  uploadCategoryImage,
  validateUpdateCategory,
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

// PATCH /api/admin/categories/:id/status - Toggle active status
router.patch('/:id/status', validateCategoryIdParam, validateCategoryStatus, (req, res, next) =>
  categoryController.updateStatus(req, res, next)
);

// PATCH /api/admin/categories/:id/order - Update display order
router.patch('/:id/order', validateCategoryIdParam, validateCategoryOrder, (req, res, next) =>
  categoryController.updateOrder(req, res, next)
);

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id', validateCategoryIdParam, (req, res, next) =>
  categoryController.deleteCategory(req, res, next)
);

module.exports = router;
