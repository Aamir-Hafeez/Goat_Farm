/**
 * Farm Settings routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET all settings
router.get('/', (req, res) => {
  const rows = db.all('SELECT * FROM farm_settings');
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json({ status: 'success', data: settings });
});

// PUT update setting (admin only — farm settings)
router.put('/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const existing = db.get('SELECT key FROM farm_settings WHERE key = ?', [key]);
  if (existing) {
    db.run('UPDATE farm_settings SET value = ? WHERE key = ?', [value, key]);
  } else {
    db.run('INSERT INTO farm_settings (key, value) VALUES (?, ?)', [key, value]);
  }
  db.save();
  res.json({ status: 'success', message: 'Setting updated' });
});

module.exports = router;