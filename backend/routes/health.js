/**
 * Health & Vaccination routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// Get all health records
router.get('/', (req, res) => {
  const records = db.all(`
    SELECT h.*, g.name as goat_name
    FROM health_records h
    JOIN goats g ON h.goat_id = g.id
    ORDER BY h.date DESC
  `);
  res.json({ status: 'success', data: records });
});

// POST health record
router.post('/', (req, res) => {
  const { goat_id, type, disease, symptoms, diagnosis, treatment, medicines, dosage, vet_name, date, next_checkup_date, notes, description } = req.body;
  if (!goat_id || !type || !date) {
    return res.status(400).json({ status: 'error', message: 'goat_id, type, and date are required' });
  }

  const finalNotes = notes || description || '';

  const { lastInsertId } = db.run(
    `INSERT INTO health_records (goat_id, type, disease, symptoms, diagnosis, treatment, medicines, dosage, vet_name, date, next_checkup_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [goat_id, type, disease || null, symptoms || null, diagnosis || null, treatment || null, medicines || null, dosage || null, vet_name || null, date, next_checkup_date || null, finalNotes]
  );
  db.save();
  res.status(201).json({ status: 'success', data: { id: lastInsertId } });
});

// PUT health record (with 1-day check for users)
router.put('/:id', checkEditPermission('health_records', 'id'), (req, res) => {
  const { id } = req.params;
  const { type, disease, symptoms, diagnosis, treatment, medicines, dosage, vet_name, date, next_checkup_date, notes } = req.body;
  db.run(`
    UPDATE health_records SET
      type = COALESCE(?, type),
      disease = COALESCE(?, disease),
      symptoms = COALESCE(?, symptoms),
      diagnosis = COALESCE(?, diagnosis),
      treatment = COALESCE(?, treatment),
      medicines = COALESCE(?, medicines),
      dosage = COALESCE(?, dosage),
      vet_name = COALESCE(?, vet_name),
      date = COALESCE(?, date),
      next_checkup_date = COALESCE(?, next_checkup_date),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `, [type, disease, symptoms, diagnosis, treatment, medicines, dosage, vet_name, date, next_checkup_date, notes, id]);
  db.save();
  res.json({ status: 'success', message: 'Health record updated' });
});

// DELETE health record (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM health_records WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Health record deleted' });
});

module.exports = router;
