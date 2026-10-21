const express = require('express');
const sizeChartController = require('../controller/sizeChart.controller');
const {
  validateSizeChartIdParam,
  validateColumnIdParam,
  validateRowIdParam,
  validateCreateSizeChart,
  validateUpdateSizeChart,
  validateSizeChartStatus,
  validateCreateColumn,
  validateUpdateColumn,
  validateCreateRow,
  validateUpdateRow
} = require('../validations/sizeChart.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');
const { uploadSizeChartImage } = require('../../middleware/upload.middleware');

const router = express.Router();

// Require admin authentication & authorization for all admin size chart routes
router.use(authenticateAdmin, authorizeAdmin);

// ==================== SIZE CHART ROOT CRUD ====================

// GET /api/admin/size-charts - List charts (with pagination, search, status, type filters)
router.get('/', (req, res, next) => sizeChartController.listAdminSizeCharts(req, res, next));

// POST /api/admin/size-charts - Create size chart (with atomic columns & rows + optional image)
router.post(
  '/',
  uploadSizeChartImage,
  validateCreateSizeChart,
  (req, res, next) => sizeChartController.createSizeChart(req, res, next)
);

// GET /api/admin/size-charts/:id - Fetch single chart with columns and rows
router.get('/:id', validateSizeChartIdParam, (req, res, next) =>
  sizeChartController.getAdminSizeChartById(req, res, next)
);

// PATCH /api/admin/size-charts/:id - Update chart metadata (or full structure)
router.patch(
  '/:id',
  validateSizeChartIdParam,
  uploadSizeChartImage,
  validateUpdateSizeChart,
  (req, res, next) => sizeChartController.updateSizeChart(req, res, next)
);

// PATCH /api/admin/size-charts/:id/status - Toggle chart status
router.patch(
  '/:id/status',
  validateSizeChartIdParam,
  validateSizeChartStatus,
  (req, res, next) => sizeChartController.updateStatus(req, res, next)
);

// DELETE /api/admin/size-charts/:id - Delete chart safely
router.delete('/:id', validateSizeChartIdParam, (req, res, next) =>
  sizeChartController.deleteSizeChart(req, res, next)
);

// ==================== NESTED COLUMNS ROUTES ====================

// GET /api/admin/size-charts/:id/columns - List columns
router.get('/:id/columns', validateSizeChartIdParam, (req, res, next) =>
  sizeChartController.listColumns(req, res, next)
);

// POST /api/admin/size-charts/:id/columns - Add a column
router.post(
  '/:id/columns',
  validateSizeChartIdParam,
  validateCreateColumn,
  (req, res, next) => sizeChartController.createColumn(req, res, next)
);

// PATCH /api/admin/size-charts/:id/columns/:columnId - Update a column
router.patch(
  '/:id/columns/:columnId',
  validateSizeChartIdParam,
  validateColumnIdParam,
  validateUpdateColumn,
  (req, res, next) => sizeChartController.updateColumn(req, res, next)
);

// DELETE /api/admin/size-charts/:id/columns/:columnId - Delete a column
router.delete(
  '/:id/columns/:columnId',
  validateSizeChartIdParam,
  validateColumnIdParam,
  (req, res, next) => sizeChartController.deleteColumn(req, res, next)
);

// ==================== NESTED ROWS ROUTES ====================

// GET /api/admin/size-charts/:id/rows - List rows
router.get('/:id/rows', validateSizeChartIdParam, (req, res, next) =>
  sizeChartController.listRows(req, res, next)
);

// POST /api/admin/size-charts/:id/rows - Add a size row
router.post(
  '/:id/rows',
  validateSizeChartIdParam,
  validateCreateRow,
  (req, res, next) => sizeChartController.createRow(req, res, next)
);

// PATCH /api/admin/size-charts/:id/rows/:rowId - Update a size row
router.patch(
  '/:id/rows/:rowId',
  validateSizeChartIdParam,
  validateRowIdParam,
  validateUpdateRow,
  (req, res, next) => sizeChartController.updateRow(req, res, next)
);

// DELETE /api/admin/size-charts/:id/rows/:rowId - Delete a size row
router.delete(
  '/:id/rows/:rowId',
  validateSizeChartIdParam,
  validateRowIdParam,
  (req, res, next) => sizeChartController.deleteRow(req, res, next)
);

module.exports = router;
