const announcementService = require('../services/announcement.service');

class AnnouncementController {
  /**
   * GET /api/announcements (Public)
   */
  async getPublicAnnouncements(req, res, next) {
    try {
      const announcements = await announcementService.getActiveAnnouncements();
      return res.status(200).json({
        status: 'success',
        results: announcements.length,
        data: {
          announcements
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/announcements (Admin list with pagination)
   */
  async listAdminAnnouncements(req, res, next) {
    try {
      const result = await announcementService.listAllAnnouncements(req.query);
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/announcements/:id (Admin get one)
   */
  async getAdminAnnouncementById(req, res, next) {
    try {
      const announcement = await announcementService.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({
          status: 'fail',
          message: `Announcement with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        status: 'success',
        data: {
          announcement
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/announcements (Admin create)
   */
  async createAnnouncement(req, res, next) {
    try {
      const announcement = await announcementService.createAnnouncement(req.validatedData);
      return res.status(201).json({
        status: 'success',
        message: 'Announcement created successfully',
        data: {
          announcement
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/announcements/:id (Admin update)
   */
  async updateAnnouncement(req, res, next) {
    try {
      const announcement = await announcementService.updateAnnouncement(
        req.params.id,
        req.validatedData
      );
      if (!announcement) {
        return res.status(404).json({
          status: 'fail',
          message: `Announcement with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Announcement updated successfully',
        data: {
          announcement
        }
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          status: 'fail',
          errors: [{ field: 'date_range', message: error.message }]
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/admin/announcements/:id/status (Admin toggle status)
   */
  async updateStatus(req, res, next) {
    try {
      const announcement = await announcementService.updateStatus(
        req.params.id,
        req.validatedData.is_active
      );
      if (!announcement) {
        return res.status(404).json({
          status: 'fail',
          message: `Announcement with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        status: 'success',
        message: `Announcement ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: {
          announcement
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/announcements/:id (Admin delete)
   */
  async deleteAnnouncement(req, res, next) {
    try {
      const success = await announcementService.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({
          status: 'fail',
          message: `Announcement with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Announcement deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnnouncementController();
