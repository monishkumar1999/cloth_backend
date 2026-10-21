const { Op } = require('sequelize');
const ProductAttribute = require('../models/ProductAttribute');
const ProductAttributeValue = require('../models/ProductAttributeValue');

class AttributeService {
  /**
   * List attributes with pagination, search, status filter, and input_type filter
   * Optionally includes child predefined values (includeValues=true)
   */
  async listAttributes(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.is_active !== undefined && query.is_active !== '') {
      where.is_active = query.is_active === 'true' || query.is_active === true;
    }
    if (query.input_type && typeof query.input_type === 'string') {
      where.input_type = query.input_type.trim().toLowerCase();
    }
    if (query.is_variant_attribute !== undefined && query.is_variant_attribute !== '') {
      where.is_variant_attribute = query.is_variant_attribute === 'true' || query.is_variant_attribute === true;
    }
    if (query.search && typeof query.search === 'string') {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: search } },
        { slug: { [Op.like]: search } }
      ];
    }

    const include = [];
    if (query.includeValues === 'true' || query.includeValues === true) {
      include.push({
        model: ProductAttributeValue,
        as: 'values',
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC']
        ]
      });
    }

    const { count, rows } = await ProductAttribute.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      include
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      attributes: rows
    };
  }

  /**
   * Get single attribute by ID with all its values
   */
  async getAttributeById(id) {
    const attribute = await ProductAttribute.findByPk(id, {
      include: [
        {
          model: ProductAttributeValue,
          as: 'values',
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return attribute;
  }

  /**
   * Create an attribute definition
   */
  async createAttribute(data) {
    const attribute = await ProductAttribute.create(data);
    return attribute;
  }

  /**
   * Update an attribute definition
   * Safeguard: if input_type is changed from select/multiselect to text/number/boolean,
   * verify whether predefined values exist and handle safely
   */
  async updateAttribute(id, data) {
    const attribute = await ProductAttribute.findByPk(id);
    if (!attribute) {
      return null;
    }

    // Safety check: changing type to non-option type when values already exist
    if (data.input_type && ['text', 'number', 'boolean'].includes(data.input_type)) {
      if (['select', 'multiselect'].includes(attribute.input_type)) {
        const valueCount = await ProductAttributeValue.count({ where: { attribute_id: id } });
        if (valueCount > 0) {
          const error = new Error(`Cannot change attribute type to '${data.input_type}' because it currently has ${valueCount} predefined option values. Delete or reassign values first.`);
          error.statusCode = 409;
          throw error;
        }
      }
    }

    await attribute.update(data);
    return attribute;
  }

  /**
   * Enable or disable attribute
   */
  async updateAttributeStatus(id, isActive) {
    const attribute = await ProductAttribute.findByPk(id);
    if (!attribute) {
      return null;
    }

    await attribute.update({ is_active: isActive });
    return attribute;
  }

  /**
   * Delete an attribute safely
   * Checks for dependent values and future product references
   */
  async deleteAttribute(id) {
    const attribute = await ProductAttribute.findByPk(id);
    if (!attribute) {
      return { found: false };
    }

    // Dependency check 1: predefined values
    const valuesCount = await ProductAttributeValue.count({ where: { attribute_id: id } });
    if (valuesCount > 0) {
      const error = new Error(`Cannot delete attribute because it has ${valuesCount} predefined values. Delete attribute values first.`);
      error.statusCode = 409;
      throw error;
    }

    // Dependency check 2: product variant values (if product variant mapping tables exist in future)
    const tables = await ProductAttribute.sequelize.getQueryInterface().showAllTables();
    if (tables.includes('product_attribute_assignments')) {
      const [assignments] = await ProductAttribute.sequelize.query(
        'SELECT COUNT(*) as count FROM product_attribute_assignments WHERE attribute_id = ?',
        { replacements: [id] }
      );
      if (assignments[0]?.count > 0) {
        const error = new Error(`Cannot delete attribute because it is referenced by existing products.`);
        error.statusCode = 409;
        throw error;
      }
    }

    await attribute.destroy();
    return { found: true, deleted: true };
  }

  // ==================== ATTRIBUTE VALUES METHODS ====================

  /**
   * List values belonging to a specific attribute
   */
  async listAttributeValues(attributeId) {
    const attribute = await ProductAttribute.findByPk(attributeId);
    if (!attribute) {
      return null;
    }

    const values = await ProductAttributeValue.findAll({
      where: { attribute_id: attributeId },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]
    });

    return { attribute, values };
  }

  /**
   * Create an attribute value under a specific attribute
   */
  async createAttributeValue(data) {
    const attributeValue = await ProductAttributeValue.create(data);
    return attributeValue;
  }

  /**
   * Get single value by ID and verify it belongs to specified attribute
   */
  async getAttributeValueById(attributeId, valueId) {
    const value = await ProductAttributeValue.findOne({
      where: {
        id: valueId,
        attribute_id: attributeId
      }
    });

    return value;
  }

  /**
   * Update an attribute value
   */
  async updateAttributeValue(attributeId, valueId, data) {
    const value = await ProductAttributeValue.findOne({
      where: {
        id: valueId,
        attribute_id: attributeId
      }
    });

    if (!value) {
      return null;
    }

    await value.update(data);
    return value;
  }

  /**
   * Enable or disable an attribute value
   */
  async updateAttributeValueStatus(attributeId, valueId, isActive) {
    const value = await ProductAttributeValue.findOne({
      where: {
        id: valueId,
        attribute_id: attributeId
      }
    });

    if (!value) {
      return null;
    }

    await value.update({ is_active: isActive });
    return value;
  }

  /**
   * Delete an attribute value safely
   */
  async deleteAttributeValue(attributeId, valueId) {
    const value = await ProductAttributeValue.findOne({
      where: {
        id: valueId,
        attribute_id: attributeId
      }
    });

    if (!value) {
      return { found: false };
    }

    // Future check: product variant referencing this specific value
    const tables = await ProductAttributeValue.sequelize.getQueryInterface().showAllTables();
    if (tables.includes('product_variant_values')) {
      const [variants] = await ProductAttributeValue.sequelize.query(
        'SELECT COUNT(*) as count FROM product_variant_values WHERE attribute_value_id = ?',
        { replacements: [valueId] }
      );
      if (variants[0]?.count > 0) {
        const error = new Error(`Cannot delete attribute value because it is referenced by existing product variants.`);
        error.statusCode = 409;
        throw error;
      }
    }

    await value.destroy();
    return { found: true, deleted: true };
  }
}

module.exports = new AttributeService();
