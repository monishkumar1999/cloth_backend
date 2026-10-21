const productService = require('../services/product.service');

class ProductController {
  /**
   * POST /api/admin/products
   * Create product with variants, prices, and design areas
   */
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/products
   * List all products with pagination and relations (or simple if ?simple=true)
   */
  async listProducts(req, res, next) {
    try {
      if (req.query.simple === 'true') {
        const result = await productService.getSimpleProductList(req.query);
        return res.status(200).json({
          success: true,
          data: result
        });
      }

      const result = await productService.listProducts(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/products/simple
   * Lightweight list containing product name and category
   */
  async getSimpleList(req, res, next) {
    try {
      const result = await productService.getSimpleProductList(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/products/:id
   * Fetch single product with all details
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/products/:id
   * Update full product details including variants, prices, and design areas
   */
  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/products/:id
   * Soft delete product
   */
  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
