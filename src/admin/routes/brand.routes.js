const express = require('express');
const brandController = require('../controller/brand.controller');
const {
  validateBrandIdParam,
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandStatus,
  validateBrandOrder
} = require('../validations/brand.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');
const { uploadBrandLogo } = require('../../middleware/upload.middleware');

const router = express.Router();

// Protect all admin brand endpoints
router.use(authenticateAdmin, authorizeAdmin);

// GET /api/admin/brands - List all brands
router.get('/', (req, res, next) => brandController.listAdminBrands(req, res, next));

// POST /api/admin/brands - Create a brand (supports JSON or multipart logo upload)
router.post(
  '/',
  uploadBrandLogo,
  validateCreateBrand,
  brandController.createBrand
);

// GET /api/admin/brands/:id - Fetch single brand
router.get('/:id', validateBrandIdParam, (req, res, next) =>
  brandController.getAdminBrandById(req, res, next)
);

// PATCH /api/admin/brands/:id - Update brand
router.patch(
  '/:id',
  validateBrandIdParam,
  uploadBrandLogo,
  validateUpdateBrand,
  (req, res, next) => brandController.updateBrand(req, res, next)
);

// PATCH /api/admin/brands/:id/status - Toggle active status
router.patch(
  '/:id/status',
  validateBrandIdParam,
  validateBrandStatus,
  (req, res, next) => brandController.updateStatus(req, res, next)
);

// PATCH /api/admin/brands/:id/order - Update display order
router.patch(
  '/:id/order',
  validateBrandIdParam,
  validateBrandOrder,
  (req, res, next) => brandController.updateOrder(req, res, next)
);

// DELETE /api/admin/brands/:id - Delete brand safely
router.delete('/:id', validateBrandIdParam, (req, res, next) =>
  brandController.deleteBrand(req, res, next)
);

module.exports = router;
