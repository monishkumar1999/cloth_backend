/**
 * Validates URLs and paths:
 * - Allowed: Relative paths starting with '/' (e.g. '/', '/collections/men', '/sale?tag=hot')
 * - Allowed: Safe absolute URLs with http: or https:
 * - Rejected: Dangerous schemes like javascript:, data:, vbscript:, file:
 */
const isSafeDestination = (destination) => {
  if (typeof destination !== 'string') return false;
  const trimmed = destination.trim();
  if (!trimmed) return false;

  // Check dangerous protocol schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // Relative path (must begin with / and not // which is protocol-relative)
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      return false; // Disallow arbitrary protocol-relative URLs
    }
    return true;
  }

  // Absolute URL
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateNavigationIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsedId = Number(id);
  if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'ID must be a positive integer' }]
    });
  }
  req.params.id = parsedId;
  next();
};

const validateCreateNavigationItem = (req, res, next) => {
  const errors = [];
  const {
    label,
    href,
    display_order,
    is_active,
    open_in_new_tab
  } = req.body;

  // Validate label (required, trimmed, max 60)
  if (label === undefined || label === null || typeof label !== 'string' || label.trim().length === 0) {
    errors.push({ field: 'label', message: 'Label is required and cannot be empty' });
  } else if (label.trim().length > 60) {
    errors.push({ field: 'label', message: 'Label must not exceed 60 characters' });
  }

  // Validate href (required, non-empty, max 500, safe format)
  if (href === undefined || href === null || typeof href !== 'string' || href.trim().length === 0) {
    errors.push({ field: 'href', message: 'href destination is required and cannot be empty' });
  } else if (href.trim().length > 500) {
    errors.push({ field: 'href', message: 'href must not exceed 500 characters' });
  } else if (!isSafeDestination(href)) {
    errors.push({
      field: 'href',
      message: 'href must be a valid relative path (e.g. /collections/men) or safe http/https URL'
    });
  }

  // Validate display_order
  if (display_order !== undefined && display_order !== null) {
    if (!Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    }
  }

  // Validate is_active
  if (is_active !== undefined && is_active !== null && typeof is_active !== 'boolean') {
    errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
  }

  // Validate open_in_new_tab
  if (open_in_new_tab !== undefined && open_in_new_tab !== null && typeof open_in_new_tab !== 'boolean') {
    errors.push({ field: 'open_in_new_tab', message: 'open_in_new_tab must be a boolean' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Explicit field allowlist (prevents mass assignment of id, timestamps, etc.)
  req.validatedData = {
    label: label.trim(),
    href: href.trim(),
    display_order: display_order !== undefined && display_order !== null ? Number(display_order) : 0,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    open_in_new_tab: open_in_new_tab !== undefined ? Boolean(open_in_new_tab) : false
  };

  next();
};

const validateUpdateNavigationItem = (req, res, next) => {
  const errors = [];
  const {
    label,
    href,
    display_order,
    is_active,
    open_in_new_tab
  } = req.body;

  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'body', message: 'At least one field must be provided for update' }]
    });
  }

  const sanitized = {};

  if (label !== undefined) {
    if (label === null || typeof label !== 'string' || label.trim().length === 0) {
      errors.push({ field: 'label', message: 'Label cannot be empty' });
    } else if (label.trim().length > 60) {
      errors.push({ field: 'label', message: 'Label must not exceed 60 characters' });
    } else {
      sanitized.label = label.trim();
    }
  }

  if (href !== undefined) {
    if (href === null || typeof href !== 'string' || href.trim().length === 0) {
      errors.push({ field: 'href', message: 'href cannot be empty' });
    } else if (href.trim().length > 500) {
      errors.push({ field: 'href', message: 'href must not exceed 500 characters' });
    } else if (!isSafeDestination(href)) {
      errors.push({
        field: 'href',
        message: 'href must be a valid relative path (e.g. /collections/men) or safe http/https URL'
      });
    } else {
      sanitized.href = href.trim();
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
    if (typeof is_active !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    } else {
      sanitized.is_active = is_active;
    }
  }

  if (open_in_new_tab !== undefined) {
    if (typeof open_in_new_tab !== 'boolean') {
      errors.push({ field: 'open_in_new_tab', message: 'open_in_new_tab must be a boolean' });
    } else {
      sanitized.open_in_new_tab = open_in_new_tab;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateNavigationStatus = (req, res, next) => {
  const { is_active } = req.body;
  if (is_active === undefined || typeof is_active !== 'boolean') {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'is_active', message: 'is_active is required and must be a boolean' }]
    });
  }

  req.validatedData = { is_active };
  next();
};

module.exports = {
  isSafeDestination,
  validateNavigationIdParam,
  validateCreateNavigationItem,
  validateUpdateNavigationItem,
  validateNavigationStatus
};
