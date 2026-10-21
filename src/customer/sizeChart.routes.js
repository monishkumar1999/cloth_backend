const express = require('express');
const sizeChartController = require('../admin/controller/sizeChart.controller');
const { validateSizeChartSlugParam } = require('../admin/validations/sizeChart.validation');

const router = express.Router();

// GET /api/size-charts - Public storefront active size charts
router.get('/', (req, res, next) => sizeChartController.getPublicSizeCharts(req, res, next));

// GET /api/size-charts/:slug - Public storefront fetch single active size chart by slug
router.get('/:slug', validateSizeChartSlugParam, (req, res, next) =>
  sizeChartController.getPublicSizeChartBySlug(req, res, next)
);

module.exports = router;
