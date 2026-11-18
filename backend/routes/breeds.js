/**
 * Goat breed list routes. Everyone can read; only admins can add/remove.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET all breeds (with how many goats use each)
router.get('/', (req, res) => {
  const rows = db.all(`
    SELECT b.id, b.name, b.created_at,
      (SELECT COUNT(*) FROM goats g WHERE LOWER(g.breed) = LOWER(b.name)) AS goat_count
    FROM breeds b
    ORDER BY b.name COLLATE NOCASE
  `);
  res.json({ status: 'success', data: rows });
});

// POST add a breed (admin only)
router.post('/', requireAdmin, (req, res) => {
  const name = String((req.body && req.body.name) || '').trim().replace(/\s+/g, ' ');
  if (!name) {
    return res.status(400).json({ status: 'error', message: 'Breed name is required' });
  }
  if (name.length > 50) {
    return res.status(400).json({ status: 'error', message: 'Breed name must be 50 characters or fewer' });
  }
  const existing = db.get('SELECT id FROM breeds WHERE name = ?', [name]);
  if (existing) {
    return res.status(409).json({ status: 'error', message: `Breed "${name}" already exists` });
  }
  const result = db.run('INSERT INTO breeds (name) VALUES (?)', [name]);
  db.save();
  res.status(201).json({ status: 'success', message: `Breed "${name}" added`, data: { id: result.lastInsertId, name } });
});

// DELETE a breed (admin only). Blocked while goats still use it.
router.delete('/:id', requireAdmin, (req, res) => {
  const breed = db.get('SELECT id, name FROM breeds WHERE id = ?', [req.params.id]);
  if (!breed) {
    return res.status(404).json({ status: 'error', message: 'Breed not found' });
  }
  const inUse = db.get('SELECT COUNT(*) AS c FROM goats WHERE LOWER(breed) = LOWER(?)', [breed.name]);
  if (inUse && inUse.c > 0) {
    return res.status(409).json({
      status: 'error',
      message: `Cannot delete "${breed.name}": ${inUse.c} goat(s) still use this breed. Change or delete those goats first.`
    });
  }
  db.run('DELETE FROM breeds WHERE id = ?', [breed.id]);
  db.save();
  res.json({ status: 'success', message: `Breed "${breed.name}" deleted` });
});

module.exports = router;
