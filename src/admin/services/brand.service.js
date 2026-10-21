const { Op } = require('sequelize');
const Brand = require('../models/Brand');

class BrandService {
  /**
   * List all brands for admin with pagination, search, and status filtering
   */
  async listAdminBrands(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.is_active !== undefined && query.is_active !== '') {
      where.is_active = query.is_active === 'true' || query.is_active === true;
    }
    if (query.search && typeof query.search === 'string') {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: search } },
        { slug: { [Op.like]: search } }
      ];
    }

    const { count, rows } = await Brand.findAndCountAll({
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
      brands: rows
    };
  }

  /**
   * Fetch single brand by ID
   */
  async getBrandById(id) {
    return Brand.findByPk(id);
  }

  /**
   * Create a new brand
   */
  async createBrand(data) {
    return Brand.create(data);
  }

  /**
   * Update brand details
   */
  async updateBrand(id, data) {
    const brand = await Brand.findByPk(id);
    if (!brand) return null;

    await brand.update(data);
    return brand;
  }

  /**
   * Enable or disable brand
   */
  async updateStatus(id, isActive) {
    const brand = await Brand.findByPk(id);
    if (!brand) return null;

    await brand.update({ is_active: isActive });
    return brand;
  }

  /**
   * Update brand display order
   */
  async updateOrder(id, displayOrder) {
    const brand = await Brand.findByPk(id);
    if (!brand) return null;

    await brand.update({ display_order: displayOrder });
    return brand;
  }

  /**
   * Delete brand safely
   * Checks for future product dependencies
   */
  async deleteBrand(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return { found: false };
    }

    // Dependency check: future products table referencing brand_id
    const tables = await Brand.sequelize.getQueryInterface().showAllTables();
    if (tables.includes('products')) {
      const [products] = await Brand.sequelize.query(
        'SELECT COUNT(*) as count FROM products WHERE brand_id = ?',
        { replacements: [id] }
      );
      if (products[0]?.count > 0) {
        const error = new Error(`Cannot delete brand because it is referenced by ${products[0].count} product(s). Reassign or archive products first.`);
        error.statusCode = 409;
        throw error;
      }
    }

    await brand.destroy();
    return { found: true, deleted: true };
  }

  /**
   * Public: List active brands with sanitized storefront fields
   */
  async getPublicBrands(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = { is_active: true };

    const { count, rows } = await Brand.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: ['id', 'name', 'slug', 'description', 'logo_url', 'website_url', 'display_order']
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      brands: rows
    };
  }

  /**
   * Public: Fetch single active brand by slug
   */
  async getPublicBrandBySlug(slug) {
    return Brand.findOne({
      where: { slug, is_active: true },
      attributes: ['id', 'name', 'slug', 'description', 'logo_url', 'website_url']
    });
  }
}

module.exports = new BrandService();
