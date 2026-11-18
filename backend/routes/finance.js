/**
 * Financial Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  const records = db.all('SELECT * FROM financials ORDER BY date DESC');
  res.json({ status: 'success', data: records });
});

router.post('/', (req, res) => {
  const { type, category, amount, date, description, goat_id, reference_no } = req.body;
  if (!type || !category || !amount || !date) {
    return res.status(400).json({ status: 'error', message: 'type, category, amount, and date are required' });
  }
  const { lastInsertId } = db.run(
    'INSERT INTO financials (type, category, amount, date, description, goat_id, reference_no) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [type, category, amount, date, description || '', goat_id || null, reference_no || null]
  );
  db.save();
  res.status(201).json({ status: 'success', data: { id: lastInsertId } });
});

// PUT update financial record (1-day edit lock for standard users)
router.put('/:id', checkEditPermission('financials'), (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;
  db.run(`
    UPDATE financials SET
      type = COALESCE(?, type),
      category = COALESCE(?, category),
      amount = COALESCE(?, amount),
      date = COALESCE(?, date),
      description = COALESCE(?, description)
    WHERE id = ?
  `, [type, category, amount, date, description, id]);
  db.save();
  res.json({ status: 'success', message: 'Financial record updated' });
});

// DELETE financial record (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM financials WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Financial record deleted' });
});

module.exports = router;