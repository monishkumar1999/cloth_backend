const { Op } = require('sequelize');
const ProductAttribute = require('../models/ProductAttribute');
const ProductAttributeValue = require('../models/ProductAttributeValue');

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const VALID_INPUT_TYPES = ['text', 'number', 'boolean', 'select', 'multiselect'];

/**
 * Normalizes input text into a URL-friendly slug / identifier
 */
const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&+/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const validateAttributeIdParam = (req, res, next) => {
  const id = Number(req.params.id || req.params.attributeId);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'attribute_id', message: 'Attribute ID must be a positive integer' }]
    });
  }
  if (req.params.id) req.params.id = id;
  if (req.params.attributeId) req.params.attributeId = id;
  next();
};

const validateValueIdParam = (req, res, next) => {
  const valueId = Number(req.params.valueId);
  if (!valueId || !Number.isInteger(valueId) || valueId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'value_id', message: 'Value ID must be a positive integer' }]
    });
  }
  req.params.valueId = valueId;
  next();
};

const validateCreateAttribute = async (req, res, next) => {
  const errors = [];
  const {
    name,
    slug,
    description,
    input_type,
    unit,
    is_variant_attribute,
    is_filterable,
    display_order,
    is_active
  } = req.body || {};

  // 1. name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Attribute name is required and cannot be empty' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Attribute name must not exceed 100 characters' });
  }

  // 2. slug validation & normalization
  let normalizedSlug = '';
  if (slug !== undefined && slug !== null && slug !== '') {
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug cannot be empty when provided' });
    } else {
      normalizedSlug = slugify(slug);
      if (normalizedSlug.length === 0) {
        errors.push({ field: 'slug', message: 'Slug must contain valid alphanumeric characters' });
      } else if (normalizedSlug.length > 120) {
        errors.push({ field: 'slug', message: 'Slug must not exceed 120 characters' });
      }
    }
  } else if (name && typeof name === 'string') {
    normalizedSlug = slugify(name);
  }

  if (normalizedSlug) {
    const existing = await ProductAttribute.findOne({ where: { slug: normalizedSlug } });
    if (existing) {
      errors.push({ field: 'slug', message: `Attribute slug '${normalizedSlug}' is already in use` });
    }
  }

  // 3. input_type validation
  const type = input_type ? String(input_type).trim().toLowerCase() : 'select';
  if (!VALID_INPUT_TYPES.includes(type)) {
    errors.push({
      field: 'input_type',
      message: `Invalid input_type. Supported types: ${VALID_INPUT_TYPES.join(', ')}`
    });
  }

  // 4. unit validation
  if (unit !== undefined && unit !== null && unit !== '') {
    if (typeof unit !== 'string' || unit.trim().length > 50) {
      errors.push({ field: 'unit', message: 'Unit must not exceed 50 characters' });
    }
  }

  // 5. booleans
  const isVariant = is_variant_attribute !== undefined ? Boolean(is_variant_attribute) : false;
  const isFilterable = is_filterable !== undefined ? Boolean(is_filterable) : true;
  const isActive = is_active !== undefined ? Boolean(is_active) : true;

  // 6. display_order
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    if (!Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize to prevent mass assignment
  req.validatedData = {
    name: name.trim(),
    slug: normalizedSlug,
    description: description && typeof description === 'string' && description.trim() ? description.trim() : null,
    input_type: type,
    unit: unit && typeof unit === 'string' && unit.trim() ? unit.trim() : null,
    is_variant_attribute: isVariant,
    is_filterable: isFilterable,
    display_order: display_order !== undefined && display_order !== null && display_order !== '' ? Number(display_order) : 0,
    is_active: isActive
  };

  next();
};

const validateUpdateAttribute = async (req, res, next) => {
  const errors = [];
  const currentId = req.params.id;
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'body', message: 'At least one field must be provided for update' }]
    });
  }

  const {
    name,
    slug,
    description,
    input_type,
    unit,
    is_variant_attribute,
    is_filterable,
    display_order,
    is_active
  } = body;

  const sanitized = {};

  if (name !== undefined) {
    if (name === null || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Attribute name cannot be empty' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Attribute name must not exceed 100 characters' });
    } else {
      sanitized.name = name.trim();
    }
  }

  if (slug !== undefined) {
    if (slug === null || typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug cannot be empty' });
    } else {
      const normalizedSlug = slugify(slug);
      if (normalizedSlug.length === 0) {
        errors.push({ field: 'slug', message: 'Slug must contain valid alphanumeric characters' });
      } else if (normalizedSlug.length > 120) {
        errors.push({ field: 'slug', message: 'Slug must not exceed 120 characters' });
      } else {
        const existing = await ProductAttribute.findOne({
          where: {
            slug: normalizedSlug,
            id: { [Op.ne]: currentId }
          }
        });
        if (existing) {
          errors.push({ field: 'slug', message: `Attribute slug '${normalizedSlug}' is already in use` });
        } else {
          sanitized.slug = normalizedSlug;
        }
      }
    }
  }

  if (input_type !== undefined) {
    const type = String(input_type).trim().toLowerCase();
    if (!VALID_INPUT_TYPES.includes(type)) {
      errors.push({
        field: 'input_type',
        message: `Invalid input_type. Supported types: ${VALID_INPUT_TYPES.join(', ')}`
      });
    } else {
      sanitized.input_type = type;
    }
  }

  if (description !== undefined) {
    sanitized.description = description && typeof description === 'string' && description.trim() ? description.trim() : null;
  }

  if (unit !== undefined) {
    sanitized.unit = unit && typeof unit === 'string' && unit.trim() ? unit.trim() : null;
  }

  if (is_variant_attribute !== undefined) {
    sanitized.is_variant_attribute = Boolean(is_variant_attribute);
  }

  if (is_filterable !== undefined) {
    sanitized.is_filterable = Boolean(is_filterable);
  }

  if (display_order !== undefined) {
    if (display_order === null || !Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      sanitized.display_order = Number(display_order);
    }
  }

  if (is_active !== undefined) {
    sanitized.is_active = Boolean(is_active);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateAttributeStatus = (req, res, next) => {
  const { is_active } = req.body;
  if (is_active === undefined || (typeof is_active !== 'boolean' && is_active !== 'true' && is_active !== 'false')) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'is_active', message: 'is_active is required and must be a boolean' }]
    });
  }
  req.validatedData = { is_active: typeof is_active === 'string' ? is_active === 'true' : Boolean(is_active) };
  next();
};

const validateCreateAttributeValue = async (req, res, next) => {
  const errors = [];
  const attributeId = req.params.attributeId;
  const {
    label,
    value,
    color_code,
    display_order,
    is_active
  } = req.body || {};

  // Check parent attribute existence and input_type constraint:
  // Text, number, boolean types do not require/support predefined values
  const attribute = await ProductAttribute.findByPk(attributeId);
  if (!attribute) {
    return res.status(404).json({
      success: false,
      message: `Attribute with ID ${attributeId} not found`
    });
  }

  if (['text', 'number', 'boolean'].includes(attribute.input_type)) {
    return res.status(400).json({
      success: false,
      errors: [{
        field: 'attribute_id',
        message: `Cannot define predefined values for attribute of type '${attribute.input_type}'. Only 'select' and 'multiselect' support predefined options.`
      }]
    });
  }

  // 1. label validation
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    errors.push({ field: 'label', message: 'Option label is required and cannot be empty' });
  } else if (label.trim().length > 100) {
    errors.push({ field: 'label', message: 'Option label must not exceed 100 characters' });
  }

  // 2. value validation (normalized slug or identifier)
  let normalizedValue = '';
  if (value !== undefined && value !== null && value !== '') {
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push({ field: 'value', message: 'Value cannot be empty' });
    } else {
      normalizedValue = slugify(value);
      if (normalizedValue.length === 0) {
        errors.push({ field: 'value', message: 'Value must contain valid alphanumeric characters' });
      } else if (normalizedValue.length > 120) {
        errors.push({ field: 'value', message: 'Value must not exceed 120 characters' });
      }
    }
  } else if (label && typeof label === 'string') {
    normalizedValue = slugify(label);
  }

  // Check duplicate value scoped to this attribute_id
  if (normalizedValue) {
    const existing = await ProductAttributeValue.findOne({
      where: {
        attribute_id: attributeId,
        value: normalizedValue
      }
    });
    if (existing) {
      errors.push({
        field: 'value',
        message: `Value '${normalizedValue}' already exists under attribute '${attribute.name}'`
      });
    }
  }

  // 3. color_code validation (optional)
  if (color_code !== undefined && color_code !== null && color_code !== '') {
    if (typeof color_code !== 'string' || !HEX_COLOR_REGEX.test(color_code.trim())) {
      errors.push({
        field: 'color_code',
        message: 'color_code must be a valid hexadecimal color (e.g. #000000 or #FFF)'
      });
    }
  }

  // 4. display_order
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    if (!Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = {
    attribute_id: Number(attributeId),
    label: label.trim(),
    value: normalizedValue,
    color_code: color_code && color_code.trim() ? color_code.trim().toUpperCase() : null,
    display_order: display_order !== undefined && display_order !== null && display_order !== '' ? Number(display_order) : 0,
    is_active: is_active !== undefined ? Boolean(is_active) : true
  };

  next();
};

const validateUpdateAttributeValue = async (req, res, next) => {
  const errors = [];
  const attributeId = req.params.attributeId;
  const valueId = req.params.valueId;
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'body', message: 'At least one field must be provided for update' }]
    });
  }

  const {
    label,
    value,
    color_code,
    display_order,
    is_active
  } = body;

  const sanitized = {};

  if (label !== undefined) {
    if (label === null || typeof label !== 'string' || label.trim().length === 0) {
      errors.push({ field: 'label', message: 'Option label cannot be empty' });
    } else if (label.trim().length > 100) {
      errors.push({ field: 'label', message: 'Option label must not exceed 100 characters' });
    } else {
      sanitized.label = label.trim();
    }
  }

  if (value !== undefined) {
    if (value === null || typeof value !== 'string' || value.trim().length === 0) {
      errors.push({ field: 'value', message: 'Value cannot be empty' });
    } else {
      const normalizedValue = slugify(value);
      if (normalizedValue.length === 0) {
        errors.push({ field: 'value', message: 'Value must contain valid alphanumeric characters' });
      } else if (normalizedValue.length > 120) {
        errors.push({ field: 'value', message: 'Value must not exceed 120 characters' });
      } else {
        const existing = await ProductAttributeValue.findOne({
          where: {
            attribute_id: attributeId,
            value: normalizedValue,
            id: { [Op.ne]: valueId }
          }
        });
        if (existing) {
          errors.push({
            field: 'value',
            message: `Value '${normalizedValue}' already exists under this attribute`
          });
        } else {
          sanitized.value = normalizedValue;
        }
      }
    }
  }

  if (color_code !== undefined) {
    if (color_code === null || color_code === '') {
      sanitized.color_code = null;
    } else if (typeof color_code !== 'string' || !HEX_COLOR_REGEX.test(color_code.trim())) {
      errors.push({
        field: 'color_code',
        message: 'color_code must be a valid hexadecimal color (e.g. #000000 or #FFF)'
      });
    } else {
      sanitized.color_code = color_code.trim().toUpperCase();
    }
  }

  if (display_order !== undefined) {
    if (display_order === null || !Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      sanitized.display_order = Number(display_order);
    }
  }

  if (is_active !== undefined) {
    sanitized.is_active = Boolean(is_active);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateAttributeValueStatus = (req, res, next) => {
  const { is_active } = req.body;
  if (is_active === undefined || (typeof is_active !== 'boolean' && is_active !== 'true' && is_active !== 'false')) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'is_active', message: 'is_active is required and must be a boolean' }]
    });
  }
  req.validatedData = { is_active: typeof is_active === 'string' ? is_active === 'true' : Boolean(is_active) };
  next();
};

module.exports = {
  slugify,
  VALID_INPUT_TYPES,
  validateAttributeIdParam,
  validateValueIdParam,
  validateCreateAttribute,
  validateUpdateAttribute,
  validateAttributeStatus,
  validateCreateAttributeValue,
  validateUpdateAttributeValue,
  validateAttributeValueStatus
};
