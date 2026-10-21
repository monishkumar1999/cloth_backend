const express = require('express');
const categoryController = require('../admin/controller/category.controller');
const { validateCategorySlugParam } = require('../admin/validations/category.validation');

const router = express.Router();

// GET /api/categories - Public storefront active categories
router.get('/', (req, res, next) => categoryController.getPublicCategories(req, res, next));

// GET /api/categories/:slug - Public storefront fetch single category by slug
router.get('/:slug', validateCategorySlugParam, (req, res, next) =>
  categoryController.getPublicCategoryBySlug(req, res, next)
);

module.exports = router;
