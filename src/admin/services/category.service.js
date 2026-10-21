const { Op } = require('sequelize');
const Category = require('../models/Category');

class CategoryService {
  /**
   * Public: Retrieve active categories for customer storefront
   * - is_active === true
   * - Sorted by display_order ASC, then id ASC
   * - Includes nested active subcategories (children)
   * - Projects customer-safe fields
   */
  async getPublicCategories() {
    const categories = await Category.findAll({
      where: {
        is_active: true,
        parent_id: null // Top-level categories
      },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: ['id', 'name', 'slug', 'description', 'image_url', 'display_order', 'parent_id'],
      include: [
        {
          model: Category,
          as: 'children',
          where: { is_active: true },
          required: false, // Left join: include children if active, but don't exclude parent if childless
          attributes: ['id', 'name', 'slug', 'description', 'image_url', 'display_order', 'parent_id'],
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return categories;
  }

  /**
   * Public: Retrieve active category by slug
   */
  async getPublicCategoryBySlug(slug) {
    const category = await Category.findOne({
      where: {
        slug,
        is_active: true
      },
      attributes: ['id', 'name', 'slug', 'description', 'image_url', 'display_order', 'parent_id'],
      include: [
        {
          model: Category,
          as: 'parent',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          as: 'children',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'slug', 'description', 'image_url', 'display_order']
        }
      ]
    });

    return category;
  }

  /**
   * Admin: List all categories with pagination, search, status filter, and hierarchy
   */
  async listAllCategories(query = {}) {
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

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      categories: rows
    };
  }

  /**
   * Admin: Get single category by ID
   */
  async getCategoryById(id) {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'is_active', 'display_order']
        }
      ]
    });

    return category;
  }

  /**
   * Admin: Create category
   */
  async createCategory(data) {
    const category = await Category.create(data);
    return category;
  }

  /**
   * Admin: Update category
   */
  async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      return null;
    }

    await category.update(data);
    return category;
  }

  /**
   * Admin: Toggle category status
   */
  async updateStatus(id, isActive) {
    const category = await Category.findByPk(id);
    if (!category) {
      return null;
    }

    await category.update({ is_active: isActive });
    return category;
  }

  /**
   * Admin: Update category display order
   */
  async updateOrder(id, displayOrder) {
    const category = await Category.findByPk(id);
    if (!category) {
      return null;
    }

    await category.update({ display_order: displayOrder });
    return category;
  }

  /**
   * Admin: Delete category with dependency validation
   * Rejects deletion if child categories or products depend on this category
   */
  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      return { found: false };
    }

    // 1. Dependency check: Child categories
    const childCount = await Category.count({ where: { parent_id: id } });
    if (childCount > 0) {
      const error = new Error(`Cannot delete category because it has ${childCount} child subcategories. Reassign or delete subcategories first.`);
      error.statusCode = 409;
      throw error;
    }

    // 2. Dependency check: Products table (if existing in schema)
    const tables = await Category.sequelize.getQueryInterface().showAllTables();
    if (tables.includes('products')) {
      const [productRef] = await Category.sequelize.query(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
        { replacements: [id] }
      );
      const productCount = productRef[0]?.count || 0;
      if (productCount > 0) {
        const error = new Error(`Cannot delete category because ${productCount} products are assigned to it. Reassign products first.`);
        error.statusCode = 409;
        throw error;
      }
    }

    await category.destroy();
    return { found: true, deleted: true };
  }
}

module.exports = new CategoryService();
