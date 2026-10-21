const { Op } = require('sequelize');
const Category = require('../models/Category');

/**
 * Helper to normalize string into URL-friendly slug
 * e.g., "Oversized T-Shirts & Hoodies" -> "oversized-t-shirts-hoodies"
 */
const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&+/g, 'and')
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces & hyphens
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading & trailing hyphens
};

const isSafeUrlOrPath = (destination) => {
  if (typeof destination !== 'string') return false;
  const trimmed = destination.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateCategoryIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsedId = Number(id);
  if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'Category ID must be a positive integer' }]
    });
  }
  req.params.id = parsedId;
  next();
};

const validateCategorySlugParam = (req, res, next) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'slug', message: 'Valid slug parameter is required' }]
    });
  }
  req.params.slug = slug.trim().toLowerCase();
  next();
};

const validateCreateCategory = async (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  // If file was uploaded via multipart/form-data, assign image_url
  if (req.files) {
    const uploadedFile =
      (req.files.image && req.files.image[0]) ||
      (req.files.image_url && req.files.image_url[0]) ||
      (req.files.file && req.files.file[0]);

    if (uploadedFile) {
      body.image_url = `/uploads/categories/${uploadedFile.filename}`;
    }
  }

  const {
    name,
    slug,
    description,
    image_url,
    parent_id,
    display_order,
    is_active
  } = body;

  // 1. Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Category name is required and cannot be empty' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Category name must not exceed 100 characters' });
  }

  // 2. Validate & normalize slug (auto-generate from name if omitted)
  let normalizedSlug = '';
  if (slug !== undefined && slug !== null && slug !== '') {
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug cannot be empty when provided' });
    } else {
      normalizedSlug = slugify(slug);
      if (normalizedSlug.length === 0) {
        errors.push({ field: 'slug', message: 'Slug contains no valid alphanumeric characters' });
      } else if (normalizedSlug.length > 120) {
        errors.push({ field: 'slug', message: 'Slug must not exceed 120 characters' });
      }
    }
  } else if (name && typeof name === 'string') {
    normalizedSlug = slugify(name);
  }

  // Check unique slug in database
  if (normalizedSlug) {
    const existingSlug = await Category.findOne({ where: { slug: normalizedSlug } });
    if (existingSlug) {
      errors.push({ field: 'slug', message: `Category slug '${normalizedSlug}' is already in use` });
    }
  }

  // 3. Validate description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be text' });
  }

  // 4. Validate image_url
  if (image_url !== undefined && image_url !== null && image_url !== '') {
    if (typeof image_url !== 'string' || image_url.trim().length > 500) {
      errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(image_url)) {
      errors.push({ field: 'image_url', message: 'image_url must be a valid path or safe http/https URL' });
    }
  }

  // 5. Validate parent_id
  let parsedParentId = null;
  if (parent_id !== undefined && parent_id !== null && parent_id !== '' && parent_id !== 'null') {
    const pid = Number(parent_id);
    if (!Number.isInteger(pid) || pid <= 0) {
      errors.push({ field: 'parent_id', message: 'parent_id must be a positive integer or null' });
    } else {
      parsedParentId = pid;
      const parentCategory = await Category.findByPk(pid);
      if (!parentCategory) {
        errors.push({ field: 'parent_id', message: `Parent category with ID ${pid} does not exist` });
      }
    }
  }

  // 6. Validate display_order
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    if (!Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    }
  }

  // 7. Validate is_active
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    const val = typeof is_active === 'string' ? is_active === 'true' : is_active;
    if (typeof val !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize to prevent mass assignment
  req.validatedData = {
    name: name.trim(),
    slug: normalizedSlug,
    description: description && description.trim() ? description.trim() : null,
    image_url: image_url && image_url.trim() ? image_url.trim() : null,
    parent_id: parsedParentId,
    display_order: display_order !== undefined && display_order !== null && display_order !== '' ? Number(display_order) : 0,
    is_active: is_active !== undefined && is_active !== null && is_active !== '' ? (typeof is_active === 'string' ? is_active === 'true' : Boolean(is_active)) : true
  };

  next();
};

const validateUpdateCategory = async (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  const currentId = req.params.id;

  if (req.files) {
    const uploadedFile =
      (req.files.image && req.files.image[0]) ||
      (req.files.image_url && req.files.image_url[0]) ||
      (req.files.file && req.files.file[0]);

    if (uploadedFile) {
      body.image_url = `/uploads/categories/${uploadedFile.filename}`;
    }
  }

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
    image_url,
    parent_id,
    display_order,
    is_active
  } = body;

  const sanitized = {};

  if (name !== undefined) {
    if (name === null || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Category name cannot be empty' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Category name must not exceed 100 characters' });
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
        errors.push({ field: 'slug', message: 'Slug contains no valid alphanumeric characters' });
      } else if (normalizedSlug.length > 120) {
        errors.push({ field: 'slug', message: 'Slug must not exceed 120 characters' });
      } else {
        const existing = await Category.findOne({
          where: {
            slug: normalizedSlug,
            id: { [Op.ne]: currentId }
          }
        });
        if (existing) {
          errors.push({ field: 'slug', message: `Category slug '${normalizedSlug}' is already in use` });
        } else {
          sanitized.slug = normalizedSlug;
        }
      }
    }
  }

  if (description !== undefined) {
    sanitized.description = description && typeof description === 'string' && description.trim() ? description.trim() : null;
  }

  if (image_url !== undefined) {
    if (image_url === null || image_url === '') {
      sanitized.image_url = null;
    } else if (typeof image_url !== 'string' || image_url.trim().length > 500) {
      errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(image_url)) {
      errors.push({ field: 'image_url', message: 'image_url must be a valid path or safe http/https URL' });
    } else {
      sanitized.image_url = image_url.trim();
    }
  }

  // Validate parent_id (prevent self-parent and circular loops)
  if (parent_id !== undefined) {
    if (parent_id === null || parent_id === '' || parent_id === 'null') {
      sanitized.parent_id = null;
    } else {
      const pid = Number(parent_id);
      if (!Number.isInteger(pid) || pid <= 0) {
        errors.push({ field: 'parent_id', message: 'parent_id must be a positive integer or null' });
      } else if (pid === currentId) {
        errors.push({ field: 'parent_id', message: 'A category cannot be its own parent' });
      } else {
        const parentCategory = await Category.findByPk(pid);
        if (!parentCategory) {
          errors.push({ field: 'parent_id', message: `Parent category with ID ${pid} does not exist` });
        } else {
          // Circular hierarchy check: Traverse upwards from target parent to ensure currentId is not an ancestor
          let ancestor = parentCategory;
          let isCircular = false;
          while (ancestor && ancestor.parent_id) {
            if (Number(ancestor.parent_id) === Number(currentId)) {
              isCircular = true;
              break;
            }
            ancestor = await Category.findByPk(ancestor.parent_id);
          }
          if (isCircular) {
            errors.push({ field: 'parent_id', message: 'Circular hierarchy detected: parent cannot be a descendant of this category' });
          } else {
            sanitized.parent_id = pid;
          }
        }
      }
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
    const val = typeof is_active === 'string' ? is_active === 'true' : is_active;
    if (typeof val !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    } else {
      sanitized.is_active = val;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateCategoryStatus = (req, res, next) => {
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

const validateCategoryOrder = (req, res, next) => {
  const { display_order } = req.body;
  if (display_order === undefined || !Number.isInteger(Number(display_order))) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'display_order', message: 'display_order is required and must be an integer' }]
    });
  }
  req.validatedData = { display_order: Number(display_order) };
  next();
};

module.exports = {
  slugify,
  isSafeUrlOrPath,
  validateCategoryIdParam,
  validateCategorySlugParam,
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus,
  validateCategoryOrder
};
