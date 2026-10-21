/**
 * Auth Middleware
 * Supports standard Bearer token / x-admin-key / mock development authentication
 * and verifies admin role.
 */
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY || 'admin-secret-key';

  // Option 1: Admin API Key header
  if (adminKey && adminKey === expectedKey) {
    req.user = { id: 1, role: 'admin' };
    return next();
  }

  // Option 2: Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === expectedKey || token === 'admin-token') {
      req.user = { id: 1, role: 'admin' };
      return next();
    }
  }

  return res.status(401).json({
    status: 'error',
    message: 'Unauthorized: Admin authentication token or x-admin-key header required'
  });
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticateAdmin,
  authorizeAdmin
};
