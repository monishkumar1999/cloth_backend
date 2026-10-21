const bannerService = require('../services/banner.service');

class BannerController {
  /**
   * GET /api/banners/homepage (Public)
   */
  async getHomepageBanners(req, res, next) {
    try {
      const banners = await bannerService.getHomepageBanners();
      return res.status(200).json({
        success: true,
        data: banners
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/banners (Admin list with pagination)
   */
  async listAdminBanners(req, res, next) {
    try {
      const result = await bannerService.listAllBanners(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/banners/:id (Admin get one)
   */
  async getAdminBannerById(req, res, next) {
    try {
      const banner = await bannerService.getBannerById(req.params.id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: `Banner with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: banner
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/banners (Admin create)
   */
  async createBanner(req, res, next) {
    try {
      const banner = await bannerService.createBanner(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: banner
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/banners/:id (Admin update)
   */
  async updateBanner(req, res, next) {
    try {
      const banner = await bannerService.updateBanner(req.params.id, req.validatedData);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: `Banner with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Banner updated successfully',
        data: banner
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'date_range', message: error.message }]
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/admin/banners/:id/status (Admin toggle status)
   */
  async updateStatus(req, res, next) {
    try {
      const banner = await bannerService.updateStatus(req.params.id, req.validatedData.is_active);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: `Banner with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Banner ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: banner
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/banners/:id/order (Admin update display order)
   */
  async updateOrder(req, res, next) {
    try {
      const banner = await bannerService.updateOrder(req.params.id, req.validatedData.display_order);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: `Banner with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Banner display order updated successfully',
        data: banner
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/banners/:id (Admin delete)
   */
  async deleteBanner(req, res, next) {
    try {
      const success = await bannerService.deleteBanner(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Banner with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Banner deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BannerController();
