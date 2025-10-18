const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies?.token;

    const finalToken = token || cookieToken;

    if (!finalToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(finalToken, process.env.JWT_SECRET);

    // Get user from database (uten deprecated talents-kolonnen)
    const result = await db.query(
      'SELECT id, first_name, last_name, email, roles, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware for horizontal access control
 * Checks if user can access a specific resource
 * 
 * @param {string} paramName - Name of the route parameter containing the resource ID (e.g., 'id', 'userId')
 * @param {string} resourceType - Type of resource ('user', 'produksjon', etc.) for logging
 * @returns {function} Express middleware
 * 
 * Rules:
 * - Admin can access all resources
 * - User can only access their own resources (req.user.id === resource ID)
 */
const checkResourceOwnership = (paramName = 'id', resourceType = 'resource') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceId = parseInt(req.params[paramName], 10);
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Admin can access everything
    if (userRoles.includes('admin')) {
      return next();
    }

    // User can only access their own data
    if (resourceId === userId) {
      return next();
    }

    // Forbidden - user trying to access another user's resource
    console.warn(`[ACCESS DENIED] User ${userId} attempted to access ${resourceType} ${resourceId}`);
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'You can only access your own data'
    });
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  checkResourceOwnership,
};

