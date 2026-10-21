const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isValidUrl = (string) => {
  if (!string) return true;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const isValidIsoDate = (dateStr) => {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsedId = Number(id);
  if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      status: 'fail',
      errors: [{ field: 'id', message: 'ID must be a positive integer' }]
    });
  }
  req.params.id = parsedId;
  next();
};

const validateCreateAnnouncement = (req, res, next) => {
  const errors = [];
  const {
    message,
    link_text,
    link_url,
    background_color,
    text_color,
    priority,
    is_active,
    starts_at,
    ends_at
  } = req.body;

  // Validate message (Required, non-empty, max 250)
  if (message === undefined || message === null || typeof message !== 'string' || message.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message is required and cannot be empty' });
  } else if (message.trim().length > 250) {
    errors.push({ field: 'message', message: 'Message must not exceed 250 characters' });
  }

  // Validate link_text
  if (link_text !== undefined && link_text !== null) {
    if (typeof link_text !== 'string' || link_text.length > 100) {
      errors.push({ field: 'link_text', message: 'link_text must be a string up to 100 characters' });
    }
  }

  // Validate link_url
  if (link_url !== undefined && link_url !== null && link_url !== '') {
    if (typeof link_url !== 'string' || !isValidUrl(link_url) || link_url.length > 2048) {
      errors.push({ field: 'link_url', message: 'link_url must be a valid http or https URL up to 2048 characters' });
    }
  }

  // Validate background_color
  if (background_color !== undefined && background_color !== null) {
    if (typeof background_color !== 'string' || !HEX_COLOR_REGEX.test(background_color)) {
      errors.push({ field: 'background_color', message: 'background_color must be a valid hexadecimal color (e.g. #171717)' });
    }
  }

  // Validate text_color
  if (text_color !== undefined && text_color !== null) {
    if (typeof text_color !== 'string' || !HEX_COLOR_REGEX.test(text_color)) {
      errors.push({ field: 'text_color', message: 'text_color must be a valid hexadecimal color (e.g. #FFFFFF)' });
    }
  }

  // Validate priority
  if (priority !== undefined && priority !== null) {
    if (!Number.isInteger(Number(priority))) {
      errors.push({ field: 'priority', message: 'priority must be an integer' });
    }
  }

  // Validate is_active
  if (is_active !== undefined && is_active !== null && typeof is_active !== 'boolean') {
    errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
  }

  // Validate dates
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
    return res.status(400).json({ status: 'fail', errors });
  }

  // Sanitize to only allowed fields (prevent mass assignment)
  req.validatedData = {
    message: message.trim(),
    link_text: link_text ? link_text.trim() : null,
    link_url: link_url ? link_url.trim() : null,
    background_color: background_color || '#171717',
    text_color: text_color || '#FFFFFF',
    priority: priority !== undefined && priority !== null ? Number(priority) : 0,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    starts_at: parsedStartsAt ? parsedStartsAt.toISOString() : null,
    ends_at: parsedEndsAt ? parsedEndsAt.toISOString() : null
  };

  next();
};

const validateUpdateAnnouncement = (req, res, next) => {
  const errors = [];
  const {
    message,
    link_text,
    link_url,
    background_color,
    text_color,
    priority,
    is_active,
    starts_at,
    ends_at
  } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      status: 'fail',
      errors: [{ field: 'body', message: 'At least one field must be provided for update' }]
    });
  }

  const sanitized = {};

  if (message !== undefined) {
    if (message === null || typeof message !== 'string' || message.trim().length === 0) {
      errors.push({ field: 'message', message: 'Message cannot be empty' });
    } else if (message.trim().length > 250) {
      errors.push({ field: 'message', message: 'Message must not exceed 250 characters' });
    } else {
      sanitized.message = message.trim();
    }
  }

  if (link_text !== undefined) {
    if (link_text !== null && (typeof link_text !== 'string' || link_text.length > 100)) {
      errors.push({ field: 'link_text', message: 'link_text must be a string up to 100 characters' });
    } else {
      sanitized.link_text = link_text ? link_text.trim() : null;
    }
  }

  if (link_url !== undefined) {
    if (link_url !== null && link_url !== '') {
      if (typeof link_url !== 'string' || !isValidUrl(link_url) || link_url.length > 2048) {
        errors.push({ field: 'link_url', message: 'link_url must be a valid http or https URL up to 2048 characters' });
      } else {
        sanitized.link_url = link_url.trim();
      }
    } else {
      sanitized.link_url = null;
    }
  }

  if (background_color !== undefined) {
    if (typeof background_color !== 'string' || !HEX_COLOR_REGEX.test(background_color)) {
      errors.push({ field: 'background_color', message: 'background_color must be a valid hexadecimal color' });
    } else {
      sanitized.background_color = background_color;
    }
  }

  if (text_color !== undefined) {
    if (typeof text_color !== 'string' || !HEX_COLOR_REGEX.test(text_color)) {
      errors.push({ field: 'text_color', message: 'text_color must be a valid hexadecimal color' });
    } else {
      sanitized.text_color = text_color;
    }
  }

  if (priority !== undefined) {
    if (!Number.isInteger(Number(priority))) {
      errors.push({ field: 'priority', message: 'priority must be an integer' });
    } else {
      sanitized.priority = Number(priority);
    }
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    } else {
      sanitized.is_active = is_active;
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
    return res.status(400).json({ status: 'fail', errors });
  }

  req.validatedData = sanitized;
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { is_active } = req.body;
  if (is_active === undefined || typeof is_active !== 'boolean') {
    return res.status(400).json({
      status: 'fail',
      errors: [{ field: 'is_active', message: 'is_active is required and must be a boolean' }]
    });
  }

  req.validatedData = { is_active };
  next();
};

module.exports = {
  validateIdParam,
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateStatusUpdate
};
