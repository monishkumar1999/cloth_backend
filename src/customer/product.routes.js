const express = require('express');
const productService = require('../admin/services/product.service');

const router = express.Router();

/**
 * GET /api/products - Public list of active products
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await productService.listProducts({ ...req.query, active_status: true });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id - Public fetch full product details by id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID must be a positive integer'
      });
    }

    const product = await productService.getProductById(id);
    if (!product || !product.active_status) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
