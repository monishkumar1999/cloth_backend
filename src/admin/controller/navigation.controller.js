const navigationService = require('../services/navigation.service');

class NavigationController {
  /**
   * GET /api/navigation/header (Public)
   */
  async getPublicHeader(req, res, next) {
    try {
      const items = await navigationService.getActiveHeaderItems();
      return res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/navigation-items (Admin list all)
   */
  async listAdminItems(req, res, next) {
    try {
      const items = await navigationService.listAllItems();
      return res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/navigation-items/:id (Admin get one)
   */
  async getAdminItemById(req, res, next) {
    try {
      const item = await navigationService.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Navigation item with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/navigation-items (Admin create)
   */
  async createItem(req, res, next) {
    try {
      const item = await navigationService.createItem(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Navigation item created successfully',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/navigation-items/:id (Admin update)
   */
  async updateItem(req, res, next) {
    try {
      const item = await navigationService.updateItem(req.params.id, req.validatedData);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Navigation item with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Navigation item updated successfully',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/navigation-items/:id/status (Admin toggle status)
   */
  async updateStatus(req, res, next) {
    try {
      const item = await navigationService.updateStatus(req.params.id, req.validatedData.is_active);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Navigation item with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Navigation item ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/navigation-items/:id (Admin delete)
   */
  async deleteItem(req, res, next) {
    try {
      const success = await navigationService.deleteItem(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Navigation item with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Navigation item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NavigationController();
