/**
 * User Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  const users = db.all('SELECT id, username, full_name, email, phone, role, created_at FROM users ORDER BY id');
  res.json({ status: 'success', data: users });
});

// POST create user (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { username, password, full_name, email, phone, role } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'error', message: 'Username and password required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const { lastInsertId } = db.run(
      'INSERT INTO users (username, password_hash, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hash, full_name || null, email || null, phone || null, role || 'user']
    );
    db.save();
    res.status(201).json({ status: 'success', data: { id: lastInsertId } });
  } catch (e) {
    res.status(400).json({ status: 'error', message: e.message });
  }
});

// PUT update user (admin or self for own profile/password)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const isSelf = parseInt(id, 10) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ status: 'error', message: 'Permission denied' });
  }

  const { full_name, email, phone, role, password } = req.body;

  // Non-admins cannot elevate role
  const targetRole = isAdmin ? role : undefined;

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.run(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role), password_hash = ? WHERE id = ?',
      [full_name, email, phone, targetRole, hash, id]
    );
  } else {
    db.run(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE id = ?',
      [full_name, email, phone, targetRole, id]
    );
  }
  db.save();
  res.json({ status: 'success', message: 'User updated' });
});

// DELETE user (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'User deleted' });
});

module.exports = router;
