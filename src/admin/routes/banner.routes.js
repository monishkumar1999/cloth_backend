const express = require('express');
const bannerController = require('../controller/banner.controller');
const {
  validateBannerIdParam,
  validateCreateBanner,
  validateUpdateBanner,
  validateBannerStatus,
  validateBannerOrder
} = require('../validations/banner.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');
const { uploadBannerImages } = require('../../middleware/upload.middleware');
const { processUploadedBannerImages } = require('../../middleware/imageProcessor.middleware');

const router = express.Router();

// Require admin authentication & authorization for all admin endpoints
router.use(authenticateAdmin, authorizeAdmin);

// GET /api/admin/banners - List all banners with pagination & search
router.get('/', (req, res, next) => bannerController.listAdminBanners(req, res, next));

// POST /api/admin/banners - Create banner (supports JSON or multipart/form-data image uploads with auto Sharp processing)
router.post(
  '/',
  uploadBannerImages,
  processUploadedBannerImages,
  validateCreateBanner,
  (req, res, next) => bannerController.createBanner(req, res, next)
);

// GET /api/admin/banners/:id - Get single banner
router.get('/:id', validateBannerIdParam, (req, res, next) =>
  bannerController.getAdminBannerById(req, res, next)
);

// PATCH /api/admin/banners/:id - Update banner (supports JSON or multipart/form-data image uploads with auto Sharp processing)
router.patch(
  '/:id',
  validateBannerIdParam,
  uploadBannerImages,
  processUploadedBannerImages,
  validateUpdateBanner,
  (req, res, next) => bannerController.updateBanner(req, res, next)
);

// PATCH /api/admin/banners/:id/status - Enable or disable banner
router.patch('/:id/status', validateBannerIdParam, validateBannerStatus, (req, res, next) =>
  bannerController.updateStatus(req, res, next)
);

// PATCH /api/admin/banners/:id/order - Update display order
router.patch('/:id/order', validateBannerIdParam, validateBannerOrder, (req, res, next) =>
  bannerController.updateOrder(req, res, next)
);

// DELETE /api/admin/banners/:id - Delete banner
router.delete('/:id', validateBannerIdParam, (req, res, next) =>
  bannerController.deleteBanner(req, res, next)
);

module.exports = router;
