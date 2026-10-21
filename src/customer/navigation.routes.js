const express = require('express');
const navigationController = require('../admin/controller/navigation.controller');

const router = express.Router();

// GET /api/navigation/header - Retrieve active header navigation items
router.get('/header', (req, res, next) => navigationController.getPublicHeader(req, res, next));

module.exports = router;
