/**
 * Authentication routes (JWT-based, bcrypt password hashing).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password required' });
  }
  const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    status: 'success',
    data: {
      token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name }
    }
  });
});

// GET /me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.get('SELECT id, username, role, full_name, email, phone, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
  res.json({ status: 'success', data: user });
});

// PUT /password - Update own password
router.put('/password', authenticateToken, (req, res) => {
  const { current_password, new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({ status: 'error', message: 'New password is required' });
  }

  const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

  // If current password is provided, check it (optional if admin updating)
  if (current_password) {
    const ok = bcrypt.compareSync(current_password, user.password_hash);
    if (!ok) return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  db.save();

  res.json({ status: 'success', message: 'Password updated successfully' });
});

module.exports = router;
