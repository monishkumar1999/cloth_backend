const express = require('express');
const brandController = require('../admin/controller/brand.controller');
const { validateBrandSlugParam } = require('../admin/validations/brand.validation');

const router = express.Router();

// GET /api/brands - Public storefront active brands
router.get('/', (req, res, next) => brandController.getPublicBrands(req, res, next));

// GET /api/brands/:slug - Public storefront single brand by slug
router.get('/:slug', validateBrandSlugParam, (req, res, next) =>
  brandController.getPublicBrandBySlug(req, res, next)
);

module.exports = router;
