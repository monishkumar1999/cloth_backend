const { Op } = require('sequelize');
const Announcement = require('../models/Announcement');

class AnnouncementService {
  /**
   * Public: Fetch all eligible announcements for homepage display.
   * Business Rules:
   * 1. is_active === true
   * 2. starts_at IS NULL OR starts_at <= NOW (in UTC)
   * 3. ends_at IS NULL OR ends_at >= NOW (in UTC)
   * 4. Sorted by priority DESC, created_at DESC
   */
  async getActiveAnnouncements() {
    const now = new Date();

    const announcements = await Announcement.findAll({
      where: {
        is_active: true,
        [Op.and]: [
          {
            [Op.or]: [
              { starts_at: null },
              { starts_at: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { ends_at: null },
              { ends_at: { [Op.gte]: now } }
            ]
          }
        ]
      },
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      attributes: [
        'id',
        'message',
        'link_text',
        'link_url',
        'background_color',
        'text_color',
        'priority',
        'starts_at',
        'ends_at',
        'created_at'
      ]
    });

    return announcements;
  }

  /**
   * Admin: List announcements with pagination
   */
  async listAllAnnouncements(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true' || query.is_active === true;
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows
    };
  }

  /**
   * Admin: Get announcement by ID
   */
  async getAnnouncementById(id) {
    const announcement = await Announcement.findByPk(id);
    return announcement;
  }

  /**
   * Admin: Create announcement
   */
  async createAnnouncement(data) {
    const announcement = await Announcement.create(data);
    return announcement;
  }

  /**
   * Admin: Update announcement
   */
  async updateAnnouncement(id, data) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return null;
    }

    // Protect against setting invalid combined date range during partial update
    const startsAt = data.starts_at !== undefined ? data.starts_at : announcement.starts_at;
    const endsAt = data.ends_at !== undefined ? data.ends_at : announcement.ends_at;

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      const error = new Error('ends_at must be later than starts_at');
      error.statusCode = 400;
      throw error;
    }

    await announcement.update(data);
    return announcement;
  }

  /**
   * Admin: Update status (enable/disable)
   */
  async updateStatus(id, isActive) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return null;
    }

    await announcement.update({ is_active: isActive });
    return announcement;
  }

  /**
   * Admin: Delete announcement
   */
  async deleteAnnouncement(id) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return null;
    }

    await announcement.destroy();
    return true;
  }
}

module.exports = new AnnouncementService();
