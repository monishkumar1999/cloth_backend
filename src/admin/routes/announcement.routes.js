const express = require('express');
const announcementController = require('../controller/announcement.controller');
const {
  validateIdParam,
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateStatusUpdate
} = require('../validations/announcement.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// Apply admin authentication & authorization to all /api/admin/announcements routes
router.use(authenticateAdmin, authorizeAdmin);

// GET /api/admin/announcements - List announcements with pagination
router.get('/', (req, res, next) => announcementController.listAdminAnnouncements(req, res, next));

// POST /api/admin/announcements - Create announcement
router.post('/', validateCreateAnnouncement, (req, res, next) =>
  announcementController.createAnnouncement(req, res, next)
);

// GET /api/admin/announcements/:id - Fetch one announcement
router.get('/:id', validateIdParam, (req, res, next) =>
  announcementController.getAdminAnnouncementById(req, res, next)
);

// PATCH /api/admin/announcements/:id - Update announcement
router.patch('/:id', validateIdParam, validateUpdateAnnouncement, (req, res, next) =>
  announcementController.updateAnnouncement(req, res, next)
);

// PATCH /api/admin/announcements/:id/status - Enable/disable announcement
router.patch('/:id/status', validateIdParam, validateStatusUpdate, (req, res, next) =>
  announcementController.updateStatus(req, res, next)
);

// DELETE /api/admin/announcements/:id - Delete announcement
router.delete('/:id', validateIdParam, (req, res, next) =>
  announcementController.deleteAnnouncement(req, res, next)
);

module.exports = router;
