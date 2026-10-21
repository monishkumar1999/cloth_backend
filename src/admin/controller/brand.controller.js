const brandService = require('../services/brand.service');

class BrandController {
  /**
   * GET /api/admin/brands (Admin list with pagination & search)
   */
  async listAdminBrands(req, res, next) {
    try {
      const result = await brandService.listAdminBrands(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/brands/:id (Admin get single brand)
   */
  async getAdminBrandById(req, res, next) {
    try {
      const brand = await brandService.getBrandById(req.params.id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: `Brand with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/brands (Admin create brand)
   */
  async createBrand(req, res, next) {
    try {
      const brand = await brandService.createBrand(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Brand created successfully',
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/brands/:id (Admin update brand)
   */
  async updateBrand(req, res, next) {
    try {
      const brand = await brandService.updateBrand(req.params.id, req.validatedData);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: `Brand with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Brand updated successfully',
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/brands/:id/status (Admin toggle status)
   */
  async updateStatus(req, res, next) {
    try {
      const brand = await brandService.updateStatus(req.params.id, req.validatedData.is_active);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: `Brand with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Brand ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/brands/:id/order (Admin update display order)
   */
  async updateOrder(req, res, next) {
    try {
      const brand = await brandService.updateOrder(req.params.id, req.validatedData.display_order);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: `Brand with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Brand display order updated successfully',
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/brands/:id (Admin delete safely)
   */
  async deleteBrand(req, res, next) {
    try {
      const result = await brandService.deleteBrand(req.params.id);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Brand with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
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

  /**
   * GET /api/brands (Public storefront active brands)
   */
  async getPublicBrands(req, res, next) {
    try {
      const result = await brandService.getPublicBrands(req.query);
      return res.status(200).json({
        success: true,
        data: result.brands,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/brands/:slug (Public storefront single brand)
   */
  async getPublicBrandBySlug(req, res, next) {
    try {
      const brand = await brandService.getPublicBrandBySlug(req.params.slug);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: `Brand with slug '${req.params.slug}' not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: brand
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BrandController();
