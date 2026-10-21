const express = require('express');
const bannerController = require('../admin/controller/banner.controller');

const router = express.Router();

// GET /api/banners/homepage - Public customer endpoint for active carousel hero banners
router.get('/homepage', (req, res, next) => bannerController.getHomepageBanners(req, res, next));

module.exports = router;
