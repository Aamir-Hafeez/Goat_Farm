/**
 * Authentication and Authorization Middleware.
 */
'use strict';

const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'goatfarm-dev-secret-change-me';

/**
 * Verifies JWT token from Authorization header or cookie.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Ensures user has 'admin' role.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Permission denied: Admin access required' });
  }
  next();
}

/**
 * Enforces 1-day edit restriction for non-admin users.
 * @param {string} tableName - DB table to check
 * @param {string} idParam - req.params key for the record ID
 * @param {string} dateColumn - Optional column to check for creation date
 */
function checkEditPermission(tableName, idParam = 'id', dateColumn = 'created_at') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    // Admins have full control always
    if (req.user.role === 'admin') return next();

    const id = req.params[idParam];
    if (!id) return next();

    const record = db.get(`SELECT ${dateColumn} FROM ${tableName} WHERE id = ?`, [id]);
    if (!record) return next(); // Let the route handle 404

    const createdAt = record[dateColumn];
    if (!createdAt) return next();

    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (now - createdTime > oneDayInMs) {
      return res.status(403).json({
        status: 'error',
        message: 'Permission denied: Standard users cannot update records older than 1 day.'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  checkEditPermission,
  JWT_SECRET
};
