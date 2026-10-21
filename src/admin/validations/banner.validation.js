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

  // Allow relative paths starting with /
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }

  // Allow absolute http and https URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidIsoDate = (dateStr) => {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

const validateBannerIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsedId = Number(id);
  if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'Banner ID must be a positive integer' }]
    });
  }
  req.params.id = parsedId;
  next();
};

const validateCreateBanner = (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  // If files were uploaded via multipart/form-data and not already processed by Sharp middleware, populate image_url & mobile_image_url
  if (req.files) {
    const desktopFile =
      (req.files.image && req.files.image[0]) ||
      (req.files.image_url && req.files.image_url[0]) ||
      (req.files.desktop_image && req.files.desktop_image[0]) ||
      (req.files.file && req.files.file[0]);

    if (desktopFile && !body.image_url) {
      body.image_url = `/uploads/banners/${desktopFile.filename}`;
    }

    const mobileFile =
      (req.files.mobile_image && req.files.mobile_image[0]) ||
      (req.files.mobile_image_url && req.files.mobile_image_url[0]);

    if (mobileFile && !body.mobile_image_url) {
      body.mobile_image_url = `/uploads/banners/${mobileFile.filename}`;
    }
  }

  const {
    name,
    eyebrow,
    title,
    subtitle,
    image_url,
    mobile_image_url,
    image_alt_text,
    cta_text,
    cta_url,
    display_order,
    is_active,
    starts_at,
    ends_at
  } = body;

  // 1. name: required, max 100
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and cannot be empty' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  // 2. eyebrow: optional, max 100
  if (eyebrow !== undefined && eyebrow !== null && eyebrow !== '') {
    if (typeof eyebrow !== 'string' || eyebrow.trim().length > 100) {
      errors.push({ field: 'eyebrow', message: 'Eyebrow must be a string up to 100 characters' });
    }
  }

  // 3. title: required, max 200
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required and cannot be empty' });
  } else if (title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
  }

  // 4. subtitle: optional, max 300
  if (subtitle !== undefined && subtitle !== null && subtitle !== '') {
    if (typeof subtitle !== 'string' || subtitle.trim().length > 300) {
      errors.push({ field: 'subtitle', message: 'Subtitle must be a string up to 300 characters' });
    }
  }

  // 5. image_url: required, safe path or url, max 500
  if (!image_url || typeof image_url !== 'string' || image_url.trim().length === 0) {
    errors.push({ field: 'image_url', message: 'Desktop image_url or image file is required' });
  } else if (image_url.trim().length > 500) {
    errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
  } else if (!isSafeUrlOrPath(image_url)) {
    errors.push({ field: 'image_url', message: 'image_url must be a valid path (e.g. /uploads/...) or safe http/https URL' });
  }

  // 6. mobile_image_url: optional, safe path or url, max 500
  if (mobile_image_url !== undefined && mobile_image_url !== null && mobile_image_url !== '') {
    if (typeof mobile_image_url !== 'string' || mobile_image_url.trim().length > 500) {
      errors.push({ field: 'mobile_image_url', message: 'mobile_image_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(mobile_image_url)) {
      errors.push({ field: 'mobile_image_url', message: 'mobile_image_url must be a valid path or safe http/https URL' });
    }
  }

  // 7. image_alt_text: optional, max 250
  if (image_alt_text !== undefined && image_alt_text !== null && image_alt_text !== '') {
    if (typeof image_alt_text !== 'string' || image_alt_text.trim().length > 250) {
      errors.push({ field: 'image_alt_text', message: 'image_alt_text must not exceed 250 characters' });
    }
  }

  // 8. cta_text: optional, max 60
  if (cta_text !== undefined && cta_text !== null && cta_text !== '') {
    if (typeof cta_text !== 'string' || cta_text.trim().length > 60) {
      errors.push({ field: 'cta_text', message: 'cta_text must not exceed 60 characters' });
    }
  }

  // 9. cta_url: optional, safe URL or path, max 500
  if (cta_url !== undefined && cta_url !== null && cta_url !== '') {
    if (typeof cta_url !== 'string' || cta_url.trim().length > 500) {
      errors.push({ field: 'cta_url', message: 'cta_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(cta_url)) {
      errors.push({ field: 'cta_url', message: 'cta_url must be a valid relative path or safe http/https URL' });
    }
  }

  // 10. display_order: optional integer, default 0
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    if (!Number.isInteger(Number(display_order))) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    }
  }

  // 11. is_active: optional boolean
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    const val = typeof is_active === 'string' ? is_active === 'true' : is_active;
    if (typeof val !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    }
  }

  // 12. starts_at & ends_at date validation
  let parsedStartsAt = null;
  let parsedEndsAt = null;

  if (starts_at !== undefined && starts_at !== null && starts_at !== '') {
    if (!isValidIsoDate(starts_at)) {
      errors.push({ field: 'starts_at', message: 'starts_at must be a valid ISO date/time' });
    } else {
      parsedStartsAt = new Date(starts_at);
    }
  }

  if (ends_at !== undefined && ends_at !== null && ends_at !== '') {
    if (!isValidIsoDate(ends_at)) {
      errors.push({ field: 'ends_at', message: 'ends_at must be a valid ISO date/time' });
    } else {
      parsedEndsAt = new Date(ends_at);
    }
  }

  if (parsedStartsAt && parsedEndsAt && parsedEndsAt <= parsedStartsAt) {
    errors.push({ field: 'ends_at', message: 'ends_at must be later than starts_at' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Explicit allowlist to prevent mass assignment
  req.validatedData = {
    name: name.trim(),
    eyebrow: eyebrow && eyebrow.trim() ? eyebrow.trim() : null,
    title: title.trim(),
    subtitle: subtitle && subtitle.trim() ? subtitle.trim() : null,
    image_url: image_url.trim(),
    mobile_image_url: mobile_image_url && mobile_image_url.trim() ? mobile_image_url.trim() : null,
    image_alt_text: image_alt_text && image_alt_text.trim() ? image_alt_text.trim() : null,
    cta_text: cta_text && cta_text.trim() ? cta_text.trim() : null,
    cta_url: cta_url && cta_url.trim() ? cta_url.trim() : null,
    display_order: display_order !== undefined && display_order !== null && display_order !== '' ? Number(display_order) : 0,
    is_active: is_active !== undefined && is_active !== null && is_active !== '' ? (typeof is_active === 'string' ? is_active === 'true' : Boolean(is_active)) : true,
    starts_at: parsedStartsAt ? parsedStartsAt.toISOString() : null,
    ends_at: parsedEndsAt ? parsedEndsAt.toISOString() : null
  };

  next();
};

const validateUpdateBanner = (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  if (req.files) {
    const desktopFile =
      (req.files.image && req.files.image[0]) ||
      (req.files.image_url && req.files.image_url[0]) ||
      (req.files.desktop_image && req.files.desktop_image[0]) ||
      (req.files.file && req.files.file[0]);

    if (desktopFile && !body.image_url) {
      body.image_url = `/uploads/banners/${desktopFile.filename}`;
    }

    const mobileFile =
      (req.files.mobile_image && req.files.mobile_image[0]) ||
      (req.files.mobile_image_url && req.files.mobile_image_url[0]);

    if (mobileFile && !body.mobile_image_url) {
      body.mobile_image_url = `/uploads/banners/${mobileFile.filename}`;
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
    eyebrow,
    title,
    subtitle,
    image_url,
    mobile_image_url,
    image_alt_text,
    cta_text,
    cta_url,
    display_order,
    is_active,
    starts_at,
    ends_at
  } = body;

  const sanitized = {};

  if (name !== undefined) {
    if (name === null || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    } else {
      sanitized.name = name.trim();
    }
  }

  if (eyebrow !== undefined) {
    if (eyebrow === null || eyebrow === '') {
      sanitized.eyebrow = null;
    } else if (typeof eyebrow !== 'string' || eyebrow.trim().length > 100) {
      errors.push({ field: 'eyebrow', message: 'Eyebrow must not exceed 100 characters' });
    } else {
      sanitized.eyebrow = eyebrow.trim();
    }
  }

  if (title !== undefined) {
    if (title === null || typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty' });
    } else if (title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    } else {
      sanitized.title = title.trim();
    }
  }

  if (subtitle !== undefined) {
    if (subtitle === null || subtitle === '') {
      sanitized.subtitle = null;
    } else if (typeof subtitle !== 'string' || subtitle.trim().length > 300) {
      errors.push({ field: 'subtitle', message: 'Subtitle must not exceed 300 characters' });
    } else {
      sanitized.subtitle = subtitle.trim();
    }
  }

  if (image_url !== undefined) {
    if (image_url === null || typeof image_url !== 'string' || image_url.trim().length === 0) {
      errors.push({ field: 'image_url', message: 'image_url cannot be empty' });
    } else if (image_url.trim().length > 500) {
      errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(image_url)) {
      errors.push({ field: 'image_url', message: 'image_url must be a valid path or safe http/https URL' });
    } else {
      sanitized.image_url = image_url.trim();
    }
  }

  if (mobile_image_url !== undefined) {
    if (mobile_image_url === null || mobile_image_url === '') {
      sanitized.mobile_image_url = null;
    } else if (typeof mobile_image_url !== 'string' || mobile_image_url.trim().length > 500) {
      errors.push({ field: 'mobile_image_url', message: 'mobile_image_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(mobile_image_url)) {
      errors.push({ field: 'mobile_image_url', message: 'mobile_image_url must be a valid path or safe http/https URL' });
    } else {
      sanitized.mobile_image_url = mobile_image_url.trim();
    }
  }

  if (image_alt_text !== undefined) {
    if (image_alt_text === null || image_alt_text === '') {
      sanitized.image_alt_text = null;
    } else if (typeof image_alt_text !== 'string' || image_alt_text.trim().length > 250) {
      errors.push({ field: 'image_alt_text', message: 'image_alt_text must not exceed 250 characters' });
    } else {
      sanitized.image_alt_text = image_alt_text.trim();
    }
  }

  if (cta_text !== undefined) {
    if (cta_text === null || cta_text === '') {
      sanitized.cta_text = null;
    } else if (typeof cta_text !== 'string' || cta_text.trim().length > 60) {
      errors.push({ field: 'cta_text', message: 'cta_text must not exceed 60 characters' });
    } else {
      sanitized.cta_text = cta_text.trim();
    }
  }

  if (cta_url !== undefined) {
    if (cta_url === null || cta_url === '') {
      sanitized.cta_url = null;
    } else if (typeof cta_url !== 'string' || cta_url.trim().length > 500) {
      errors.push({ field: 'cta_url', message: 'cta_url must not exceed 500 characters' });
    } else if (!isSafeUrlOrPath(cta_url)) {
      errors.push({ field: 'cta_url', message: 'cta_url must be a valid relative path or safe http/https URL' });
    } else {
      sanitized.cta_url = cta_url.trim();
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

  let parsedStartsAt;
  let parsedEndsAt;

  if (starts_at !== undefined) {
    if (starts_at !== null && starts_at !== '') {
      if (!isValidIsoDate(starts_at)) {
        errors.push({ field: 'starts_at', message: 'starts_at must be a valid ISO date/time' });
      } else {
        parsedStartsAt = new Date(starts_at);
        sanitized.starts_at = parsedStartsAt.toISOString();
      }
    } else {
      sanitized.starts_at = null;
    }
  }

  if (ends_at !== undefined) {
    if (ends_at !== null && ends_at !== '') {
      if (!isValidIsoDate(ends_at)) {
        errors.push({ field: 'ends_at', message: 'ends_at must be a valid ISO date/time' });
      } else {
        parsedEndsAt = new Date(ends_at);
        sanitized.ends_at = parsedEndsAt.toISOString();
      }
    } else {
      sanitized.ends_at = null;
    }
  }

  if (parsedStartsAt && parsedEndsAt && parsedEndsAt <= parsedStartsAt) {
    errors.push({ field: 'ends_at', message: 'ends_at must be later than starts_at' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateBannerStatus = (req, res, next) => {
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

const validateBannerOrder = (req, res, next) => {
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
  isSafeUrlOrPath,
  validateBannerIdParam,
  validateCreateBanner,
  validateUpdateBanner,
  validateBannerStatus,
  validateBannerOrder
};
