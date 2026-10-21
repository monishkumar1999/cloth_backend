const express = require('express');
const attributeController = require('../controller/attribute.controller');
const {
  validateAttributeIdParam,
  validateValueIdParam,
  validateCreateAttribute,
  validateUpdateAttribute,
  validateAttributeStatus,
  validateCreateAttributeValue,
  validateUpdateAttributeValue,
  validateAttributeValueStatus
} = require('../validations/attribute.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// Require admin authentication and authorization for all endpoints
router.use(authenticateAdmin, authorizeAdmin);

// ==================== ATTRIBUTE ENDPOINTS ====================

// GET /api/admin/attributes - List attributes (with pagination, search, filter, includeValues)
router.get('/', (req, res, next) => attributeController.listAttributes(req, res, next));

// POST /api/admin/attributes - Create attribute definition
router.post('/', validateCreateAttribute, (req, res, next) =>
  attributeController.createAttribute(req, res, next)
);

// GET /api/admin/attributes/:id - Fetch single attribute with values
router.get('/:id', validateAttributeIdParam, (req, res, next) =>
  attributeController.getAttributeById(req, res, next)
);

// PATCH /api/admin/attributes/:id - Update attribute definition
router.patch('/:id', validateAttributeIdParam, validateUpdateAttribute, (req, res, next) =>
  attributeController.updateAttribute(req, res, next)
);

// PATCH /api/admin/attributes/:id/status - Toggle attribute status
router.patch('/:id/status', validateAttributeIdParam, validateAttributeStatus, (req, res, next) =>
  attributeController.updateAttributeStatus(req, res, next)
);

// DELETE /api/admin/attributes/:id - Delete attribute safely
router.delete('/:id', validateAttributeIdParam, (req, res, next) =>
  attributeController.deleteAttribute(req, res, next)
);

// ==================== ATTRIBUTE VALUES NESTED ENDPOINTS ====================

// GET /api/admin/attributes/:attributeId/values - List values for attribute
router.get('/:attributeId/values', validateAttributeIdParam, (req, res, next) =>
  attributeController.listAttributeValues(req, res, next)
);

// POST /api/admin/attributes/:attributeId/values - Create value under attribute
router.post(
  '/:attributeId/values',
  validateAttributeIdParam,
  validateCreateAttributeValue,
  (req, res, next) => attributeController.createAttributeValue(req, res, next)
);

// PATCH /api/admin/attributes/:attributeId/values/:valueId - Update value
router.patch(
  '/:attributeId/values/:valueId',
  validateAttributeIdParam,
  validateValueIdParam,
  validateUpdateAttributeValue,
  (req, res, next) => attributeController.updateAttributeValue(req, res, next)
);

// PATCH /api/admin/attributes/:attributeId/values/:valueId/status - Toggle value status
router.patch(
  '/:attributeId/values/:valueId/status',
  validateAttributeIdParam,
  validateValueIdParam,
  validateAttributeValueStatus,
  (req, res, next) => attributeController.updateAttributeValueStatus(req, res, next)
);

// DELETE /api/admin/attributes/:attributeId/values/:valueId - Delete value
router.delete(
  '/:attributeId/values/:valueId',
  validateAttributeIdParam,
  validateValueIdParam,
  (req, res, next) => attributeController.deleteAttributeValue(req, res, next)
);

module.exports = router;
