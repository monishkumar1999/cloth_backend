const { Op } = require('sequelize');
const Brand = require('../models/Brand');

/**
 * Normalizes string to URL-friendly slug
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

/**
 * Validates website URLs (safe http / https scheme only)
 */
const isValidWebsiteUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateBrandIdParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'Brand ID must be a positive integer' }]
    });
  }
  req.params.id = id;
  next();
};

const validateBrandSlugParam = (req, res, next) => {
  const slug = req.params.slug ? req.params.slug.trim().toLowerCase() : '';
  if (!slug || slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'slug', message: 'Invalid slug format. Must be lowercase alphanumeric with hyphens.' }]
    });
  }
  req.params.slug = slug;
  next();
};

const validateCreateBrand = async (req, res, next) => {
  const errors = [];
  const {
    name,
    slug,
    description,
    logo_url,
    website_url,
    display_order,
    is_active
  } = req.body || {};

  // 1. Name validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Brand name is required' });
  } else if (name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Brand name must not exceed 150 characters' });
  }

  // 2. Slug validation
  let normalizedSlug = slug ? slugify(slug) : slugify(name);
  if (!normalizedSlug) {
    errors.push({ field: 'slug', message: 'A valid slug could not be generated' });
  } else if (normalizedSlug.length > 180) {
    errors.push({ field: 'slug', message: 'Slug must not exceed 180 characters' });
  } else {
    const existing = await Brand.findOne({ where: { slug: normalizedSlug } });
    if (existing) {
      errors.push({ field: 'slug', message: `Brand with slug '${normalizedSlug}' already exists` });
    }
  }

  // 3. Website URL validation
  let cleanWebsiteUrl = null;
  if (website_url !== undefined && website_url !== null && website_url !== '') {
    if (typeof website_url !== 'string' || !isValidWebsiteUrl(website_url)) {
      errors.push({ field: 'website_url', message: 'website_url must be a valid HTTP or HTTPS URL' });
    } else if (website_url.trim().length > 500) {
      errors.push({ field: 'website_url', message: 'website_url must not exceed 500 characters' });
    } else {
      cleanWebsiteUrl = website_url.trim();
    }
  }

  // 4. Logo URL / file upload handling
  let finalLogoUrl = null;
  if (req.files && (req.files.logo || req.files.logo_url || req.files.image || req.files.file)) {
    const uploadedFile = (req.files.logo || req.files.logo_url || req.files.image || req.files.file)[0];
    finalLogoUrl = `/uploads/brands/${uploadedFile.filename}`;
  } else if (logo_url && typeof logo_url === 'string') {
    finalLogoUrl = logo_url.trim();
  }

  if (finalLogoUrl && finalLogoUrl.length > 500) {
    errors.push({ field: 'logo_url', message: 'logo_url must not exceed 500 characters' });
  }

  // 5. Display order
  let finalDisplayOrder = 0;
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      finalDisplayOrder = orderNum;
    }
  }

  // 6. is_active
  let finalIsActive = true;
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    finalIsActive = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = {
    name: name.trim(),
    slug: normalizedSlug,
    description: description && typeof description === 'string' ? description.trim() : null,
    logo_url: finalLogoUrl,
    website_url: cleanWebsiteUrl,
    display_order: finalDisplayOrder,
    is_active: finalIsActive
  };

  next();
};

const validateUpdateBrand = async (req, res, next) => {
  const brandId = req.params.id;
  const errors = [];
  const {
    name,
    slug,
    description,
    logo_url,
    website_url,
    display_order,
    is_active
  } = req.body || {};

  const validatedData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      errors.push({ field: 'name', message: 'Brand name cannot be empty' });
    } else if (name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Brand name must not exceed 150 characters' });
    } else {
      validatedData.name = name.trim();
    }
  }

  if (slug !== undefined) {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      errors.push({ field: 'slug', message: 'Slug cannot be empty' });
    } else if (normalizedSlug.length > 180) {
      errors.push({ field: 'slug', message: 'Slug must not exceed 180 characters' });
    } else {
      const existing = await Brand.findOne({
        where: {
          slug: normalizedSlug,
          id: { [Op.ne]: brandId }
        }
      });
      if (existing) {
        errors.push({ field: 'slug', message: `Brand with slug '${normalizedSlug}' already exists` });
      } else {
        validatedData.slug = normalizedSlug;
      }
    }
  }

  if (description !== undefined) {
    validatedData.description = description && typeof description === 'string' ? description.trim() : null;
  }

  if (website_url !== undefined) {
    if (website_url === null || website_url === '') {
      validatedData.website_url = null;
    } else if (typeof website_url !== 'string' || !isValidWebsiteUrl(website_url)) {
      errors.push({ field: 'website_url', message: 'website_url must be a valid HTTP or HTTPS URL' });
    } else if (website_url.trim().length > 500) {
      errors.push({ field: 'website_url', message: 'website_url must not exceed 500 characters' });
    } else {
      validatedData.website_url = website_url.trim();
    }
  }

  if (req.files && (req.files.logo || req.files.logo_url || req.files.image || req.files.file)) {
    const uploadedFile = (req.files.logo || req.files.logo_url || req.files.image || req.files.file)[0];
    validatedData.logo_url = `/uploads/brands/${uploadedFile.filename}`;
  } else if (logo_url !== undefined) {
    if (logo_url === null || logo_url === '') {
      validatedData.logo_url = null;
    } else if (typeof logo_url === 'string') {
      if (logo_url.trim().length > 500) {
        errors.push({ field: 'logo_url', message: 'logo_url must not exceed 500 characters' });
      } else {
        validatedData.logo_url = logo_url.trim();
      }
    }
  }

  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      validatedData.display_order = orderNum;
    }
  }

  if (is_active !== undefined && is_active !== null && is_active !== '') {
    validatedData.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = validatedData;
  next();
};

const validateBrandStatus = (req, res, next) => {
  const { is_active } = req.body || {};
  if (is_active === undefined || is_active === null) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'is_active', message: 'is_active boolean field is required' }]
    });
  }

  const finalIsActive = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  req.validatedData = { is_active: finalIsActive };
  next();
};

const validateBrandOrder = (req, res, next) => {
  const { display_order } = req.body || {};
  if (display_order === undefined || display_order === null || display_order === '') {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'display_order', message: 'display_order integer field is required' }]
    });
  }

  const orderNum = Number(display_order);
  if (!Number.isInteger(orderNum)) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'display_order', message: 'display_order must be an integer' }]
    });
  }

  req.validatedData = { display_order: orderNum };
  next();
};

module.exports = {
  slugify,
  isValidWebsiteUrl,
  validateBrandIdParam,
  validateBrandSlugParam,
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandStatus,
  validateBrandOrder
};
