const fs = require('fs');
const path = require('path');

// Base public uploads directory
const PUBLIC_UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'public', 'uploads');

/**
 * Helper to strip any host / scheme and return relative path e.g. /uploads/products/xxx.jpg
 */
function toRelativePath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return urlOrPath;

  const uploadsIndex = urlOrPath.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return urlOrPath.substring(uploadsIndex);
  }

  return urlOrPath;
}

/**
 * Helper to get the base URL of the backend (e.g. http://localhost:5000)
 */
function getBaseUrl() {
  const port = process.env.PORT || 5000;
  return process.env.APP_URL || `http://localhost:${port}`;
}

/**
 * Converts a relative path like /uploads/... to a full URL http://localhost:5000/uploads/...
 */
function toFullUrl(relativeOrFullUrl) {
  if (!relativeOrFullUrl || typeof relativeOrFullUrl !== 'string') return relativeOrFullUrl;
  if (relativeOrFullUrl.startsWith('http://') || relativeOrFullUrl.startsWith('https://')) {
    return relativeOrFullUrl;
  }
  const cleanPath = relativeOrFullUrl.startsWith('/') ? relativeOrFullUrl : `/${relativeOrFullUrl}`;
  return `${getBaseUrl()}${cleanPath}`;
}

/**
 * Saves a base64 or data-URL encoded image to disk under /public/uploads/products/
 * Always returns a clean relative URL path for database storage (e.g. /uploads/products/variant-xxx.jpg).
 * 
 * @param {string} base64String 
 * @param {string} prefix 
 * @returns {string|null} Relative path e.g. /uploads/products/variant-xxx.jpg
 */
function saveBase64Image(base64String, prefix = 'product') {
  if (!base64String || typeof base64String !== 'string') return null;

  // If already a relative /uploads/... or full URL pointing to /uploads/...
  if (base64String.includes('/uploads/')) {
    return toRelativePath(base64String);
  }

  // If external non-base64 http link
  if ((base64String.startsWith('http://') || base64String.startsWith('https://')) && !base64String.startsWith('data:')) {
    return base64String;
  }

  // Sanitize prefix for filenames
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Match data:image/png;base64,... or raw base64
  const matches = base64String.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  let extension = 'jpg';
  let buffer;

  if (matches) {
    extension = matches[1].replace('jpeg', 'jpg');
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Try raw base64
    try {
      buffer = Buffer.from(base64String, 'base64');
    } catch {
      return null;
    }
  }

  const productsDir = path.join(PUBLIC_UPLOADS_DIR, 'products');
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const filename = `${safePrefix}-${uniqueId}.${extension}`;
  const filePath = path.join(productsDir, filename);

  fs.writeFileSync(filePath, buffer);

  // Return clean relative path for DB persistence
  return `/uploads/products/${filename}`;
}

module.exports = {
  saveBase64Image,
  toRelativePath,
  toFullUrl,
  getBaseUrl,
  PUBLIC_UPLOADS_DIR
};
