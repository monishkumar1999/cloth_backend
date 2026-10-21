const express = require('express');
const productController = require('../controller/product.controller');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductIdParam
} = require('../validations/product.validation');
const { authenticateAdmin, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// Protect all admin product routes
router.use(authenticateAdmin, authorizeAdmin);

// POST /api/admin/products - Create product with variants, prices, and design zones
router.post('/', validateCreateProduct, (req, res, next) =>
  productController.createProduct(req, res, next)
);

// GET /api/admin/products - List products (supports ?simple=true)
router.get('/', (req, res, next) =>
  productController.listProducts(req, res, next)
);

// GET /api/admin/products/simple - Lightweight product list (id, product_name, category)
router.get('/simple', (req, res, next) =>
  productController.getSimpleList(req, res, next)
);

// GET /api/admin/products/:id - Single product details
router.get('/:id', validateProductIdParam, (req, res, next) =>
  productController.getProductById(req, res, next)
);

// PUT /api/admin/products/:id - Update product
router.put('/:id', validateProductIdParam, validateUpdateProduct, (req, res, next) =>
  productController.updateProduct(req, res, next)
);

// PATCH /api/admin/products/:id - Partial update
router.patch('/:id', validateProductIdParam, validateUpdateProduct, (req, res, next) =>
  productController.updateProduct(req, res, next)
);

// DELETE /api/admin/products/:id - Soft delete product
router.delete('/:id', validateProductIdParam, (req, res, next) =>
  productController.deleteProduct(req, res, next)
);

module.exports = router;
