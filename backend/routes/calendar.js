/**
 * Breeding Calendar routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET calendar events with optional filtering
router.get('/', (req, res) => {
  const { goat_id, event_type, from_date, to_date, status } = req.query;
  let sql = `
    SELECT c.*, g.name as goat_name, g.qr_code_id
    FROM calendar_events c
    LEFT JOIN goats g ON c.goat_id = g.id
    WHERE 1=1
  `;
  const params = [];
  if (goat_id) { sql += ' AND c.goat_id = ?'; params.push(goat_id); }
  if (event_type) { sql += ' AND c.event_type = ?'; params.push(event_type); }
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  if (from_date) { sql += ' AND c.event_date >= ?'; params.push(from_date); }
  if (to_date) { sql += ' AND c.event_date <= ?'; params.push(to_date); }
  sql += ' ORDER BY c.event_date ASC';
  res.json({ status: 'success', data: db.all(sql, params) });
});

// POST create calendar event
router.post('/', (req, res) => {
  const { goat_id, title, event_type, event_date, description, status } = req.body;
  if (!title || !event_type || !event_date) return res.status(400).json({ status: 'error', message: 'title, event_type, and event_date are required' });
  const { lastInsertId } = db.run(
    'INSERT INTO calendar_events (goat_id, title, event_type, event_date, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [goat_id || null, title, event_type, event_date, description || '', status || 'Scheduled']
  );
  db.save();
  res.status(201).json({ status: 'success', data: { id: lastInsertId } });
});

// PUT update calendar event (1-day edit lock for standard users)
router.put('/:id', checkEditPermission('calendar_events'), (req, res) => {
  const { id } = req.params;
  const { title, event_type, event_date, description, status } = req.body;
  db.run(`
    UPDATE calendar_events SET
      title = COALESCE(?, title),
      event_type = COALESCE(?, event_type),
      event_date = COALESCE(?, event_date),
      description = COALESCE(?, description),
      status = COALESCE(?, status)
    WHERE id = ?
  `, [title, event_type, event_date, description, status, id]);
  db.save();
  res.json({ status: 'success', message: 'Calendar event updated' });
});

// DELETE calendar event (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM calendar_events WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Calendar event deleted' });
});

module.exports = router;