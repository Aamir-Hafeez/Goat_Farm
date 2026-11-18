/**
 * Feeding & Nutrition Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET feed inventory
router.get('/inventory', (req, res) => {
  const items = db.all('SELECT * FROM feed_inventory ORDER BY name');
  res.json({ status: 'success', data: items });
});

// POST add feed inventory item
router.post('/inventory', (req, res) => {
  const { name, category, stock_kg, min_stock_kg, unit_cost, supplier } = req.body;
  if (!name) return res.status(400).json({ status: 'error', message: 'Feed name is required' });
  const { lastInsertId } = db.run(
    'INSERT INTO feed_inventory (name, category, stock_kg, min_stock_kg, unit_cost, supplier) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category || 'Forage', stock_kg || 0, min_stock_kg || 50, unit_cost || 0, supplier || null]
  );
  db.save();
  res.status(201).json({ status: 'success', data: { id: lastInsertId } });
});

// PUT update feed inventory item (1-day edit lock for standard users)
router.put('/inventory/:id', checkEditPermission('feed_inventory', 'id', 'last_updated'), (req, res) => {
  const { id } = req.params;
  const { name, category, stock_kg, min_stock_kg, unit_cost, supplier } = req.body;
  db.run(`
    UPDATE feed_inventory SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      stock_kg = COALESCE(?, stock_kg),
      min_stock_kg = COALESCE(?, min_stock_kg),
      unit_cost = COALESCE(?, unit_cost),
      supplier = COALESCE(?, supplier),
      last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, category, stock_kg, min_stock_kg, unit_cost, supplier, id]);
  db.save();
  res.json({ status: 'success', message: 'Feed inventory updated' });
});

// DELETE feed inventory item (admin only)
router.delete('/inventory/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM feed_inventory WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Feed inventory item deleted' });
});

// GET feeding records
router.get('/records', (req, res) => {
  const { goat_id, group_name, date } = req.query;
  let sql = `
    SELECT f.*, fi.name as feed_name
    FROM feeding_records f
    LEFT JOIN feed_inventory fi ON f.feed_id = fi.id
    WHERE 1=1
  `;
  const params = [];
  if (goat_id) { sql += ' AND f.goat_id = ?'; params.push(goat_id); }
  if (group_name) { sql += ' AND f.group_name LIKE ?'; params.push(`%${group_name}%`); }
  if (date) { sql += ' AND f.date = ?'; params.push(date); }
  sql += ' ORDER BY f.date DESC';
  res.json({ status: 'success', data: db.all(sql, params) });
});

// POST feeding record
router.post('/records', (req, res) => {
  const { feed_id, goat_id, group_name, feed_type, amount_kg, cost, date, notes } = req.body;
  if (!feed_type || !amount_kg) return res.status(400).json({ status: 'error', message: 'feed_type and amount_kg are required' });
  const { lastInsertId } = db.run(
    'INSERT INTO feeding_records (feed_id, goat_id, group_name, feed_type, amount_kg, cost, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [feed_id || null, goat_id || null, group_name || null, feed_type, amount_kg, cost || 0, date || new Date().toISOString().split('T')[0], notes || '']
  );
  db.save();
  res.status(201).json({ status: 'success', data: { id: lastInsertId } });
});

// PUT update feeding record (1-day edit lock for standard users)
router.put('/records/:id', checkEditPermission('feeding_records'), (req, res) => {
  const { id } = req.params;
  const { feed_type, amount_kg, cost, date, notes, group_name } = req.body;
  db.run(`
    UPDATE feeding_records SET
      feed_type = COALESCE(?, feed_type),
      amount_kg = COALESCE(?, amount_kg),
      cost = COALESCE(?, cost),
      date = COALESCE(?, date),
      notes = COALESCE(?, notes),
      group_name = COALESCE(?, group_name)
    WHERE id = ?
  `, [feed_type, amount_kg, cost, date, notes, group_name, id]);
  db.save();
  res.json({ status: 'success', message: 'Feeding record updated' });
});

// DELETE feeding record (admin only)
router.delete('/records/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM feeding_records WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Feeding record deleted' });
});

// GET low stock alerts
router.get('/alerts', (req, res) => {
  const items = db.all('SELECT * FROM feed_inventory WHERE stock_kg <= min_stock_kg ORDER BY stock_kg ASC');
  res.json({ status: 'success', data: items });
});

module.exports = router;