const categoryService = require('../services/category.service');

class CategoryController {
  /**
   * GET /api/categories (Public)
   */
  async getPublicCategories(req, res, next) {
    try {
      const categories = await categoryService.getPublicCategories();
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:slug (Public)
   */
  async getPublicCategoryBySlug(req, res, next) {
    try {
      const category = await categoryService.getPublicCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Category with slug '${req.params.slug}' not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/categories (Admin list with pagination & search)
   */
  async listAdminCategories(req, res, next) {
    try {
      const result = await categoryService.listAllCategories(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/categories/:id (Admin get one)
   */
  async getAdminCategoryById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/categories (Admin create)
   */
  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/categories/:id (Admin update)
   */
  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.validatedData);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/categories/:id/status (Admin toggle active status)
   */
  async updateStatus(req, res, next) {
    try {
      const category = await categoryService.updateStatus(req.params.id, req.validatedData.is_active);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Category ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/categories/:id/order (Admin update display order)
   */
  async updateOrder(req, res, next) {
    try {
      const category = await categoryService.updateOrder(req.params.id, req.validatedData.display_order);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Category display order updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/categories/:id (Admin delete safely)
   */
  async deleteCategory(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new CategoryController();
