const express = require('express');
const announcementController = require('../admin/controller/announcement.controller');

const router = express.Router();

// GET /api/announcements - Public: fetch announcements eligible for homepage display
router.get('/', (req, res, next) => announcementController.getPublicAnnouncements(req, res, next));

module.exports = router;
