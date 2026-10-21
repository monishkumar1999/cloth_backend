const { Op } = require('sequelize');
const Banner = require('../models/Banner');

class BannerService {
  /**
   * Public: Retrieve eligible homepage hero banners
   * Business Rules:
   * 1. is_active === true
   * 2. starts_at IS NULL OR starts_at <= NOW (in UTC)
   * 3. ends_at IS NULL OR ends_at >= NOW (in UTC)
   * 4. Ordered by display_order ASC, then id ASC (deterministic tie-breaker)
   * 5. Projection: Customer-facing fields only
   */
  async getHomepageBanners() {
    const now = new Date();

    const banners = await Banner.findAll({
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
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: [
        'id',
        'eyebrow',
        'title',
        'subtitle',
        'image_url',
        'mobile_image_url',
        'image_alt_text',
        'cta_text',
        'cta_url',
        'display_order'
      ]
    });

    return banners;
  }

  /**
   * Admin: List all banners with pagination, optional status & search filtering
   */
  async listAllBanners(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true' || query.is_active === true;
    }
    if (query.search && typeof query.search === 'string') {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: search } },
        { title: { [Op.like]: search } }
      ];
    }

    const { count, rows } = await Banner.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      banners: rows
    };
  }

  /**
   * Admin: Get banner by ID
   */
  async getBannerById(id) {
    const banner = await Banner.findByPk(id);
    return banner;
  }

  /**
   * Admin: Create banner
   */
  async createBanner(data) {
    const banner = await Banner.create(data);
    return banner;
  }

  /**
   * Admin: Update banner
   */
  async updateBanner(id, data) {
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return null;
    }

    // Protect against setting invalid combined date range during partial update
    const startsAt = data.starts_at !== undefined ? data.starts_at : banner.starts_at;
    const endsAt = data.ends_at !== undefined ? data.ends_at : banner.ends_at;

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      const error = new Error('ends_at must be later than starts_at');
      error.statusCode = 400;
      throw error;
    }

    await banner.update(data);
    return banner;
  }

  /**
   * Admin: Update banner active status
   */
  async updateStatus(id, isActive) {
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return null;
    }

    await banner.update({ is_active: isActive });
    return banner;
  }

  /**
   * Admin: Update banner display order
   */
  async updateOrder(id, displayOrder) {
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return null;
    }

    await banner.update({ display_order: displayOrder });
    return banner;
  }

  /**
   * Admin: Delete banner
   */
  async deleteBanner(id) {
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return null;
    }

    await banner.destroy();
    return true;
  }
}

module.exports = new BannerService();
