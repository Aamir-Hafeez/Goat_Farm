/**
 * Breeding Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const breedingService = require('../services/breeding');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// GET all breeding records
router.get('/', (req, res) => {
  const records = db.all(`
    SELECT b.*,
      f.name as female_name, f.breed as female_breed, f.qr_code_id as female_qr,
      m.name as male_name, m.breed as male_breed, m.qr_code_id as male_qr
    FROM breeding_records b
    JOIN goats f ON b.female_id = f.id
    JOIN goats m ON b.male_id = m.id
    ORDER BY b.mating_date DESC
  `);

  res.json({ status: 'success', data: records });
});

// POST Record new mating attempt
router.post('/', (req, res) => {
  const { female_id, male_id, mating_date, method, status, notes } = req.body;

  if (!female_id || !male_id || !mating_date) {
    return res.status(400).json({ status: 'error', message: 'Female ID, Male ID, and mating date are required' });
  }

  // Check inbreeding
  const check = breedingService.checkInbreeding(male_id, female_id);
  if (check.severity === 'PROHIBITED') {
    return res.status(400).json({
      status: 'error',
      message: `Prohibited Mating: ${check.message}`,
      inbreedingDetails: check
    });
  }

  // Note: db.save() (sql.js export) cannot run while a transaction is open,
  // so it — and the response — must happen after the transaction commits,
  // not inside the callback.
  const { breedingId, expectedDelivery } = db.transaction(() => {
    const { lastInsertId: breedingId } = db.run(`
      INSERT INTO breeding_records (female_id, male_id, mating_date, method, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [female_id, male_id, mating_date, method || 'Natural', status || 'Successful', notes || '']);

    let expectedDelivery = null;
    if (status === 'Successful' || status === 'confirmed' || !status) {
      expectedDelivery = breedingService.calculateDeliveryDate(mating_date);

      db.run(`
        INSERT INTO pregnancy_records (breeding_id, goat_id, confirmation_date, expected_delivery_date, status, health_status)
        VALUES (?, ?, ?, ?, 'Pregnant', 'Good')
      `, [breedingId, female_id, new Date().toISOString().split('T')[0], expectedDelivery]);

      db.run("UPDATE goats SET breeding_status = 'Pregnant' WHERE id = ?", [female_id]);

      db.run(`
        INSERT INTO calendar_events (goat_id, title, event_type, event_date, description)
        VALUES (?, ?, 'Expected Delivery', ?, ?)
      `, [female_id, `Expected Delivery - Goat #${female_id}`, expectedDelivery, `Calculated delivery date for breeding record #${breedingId}`]);
    }

    return { breedingId, expectedDelivery };
  });

  db.save();
  res.status(201).json({
    status: 'success',
    data: {
      id: breedingId,
      expected_delivery_date: expectedDelivery,
      inbreedingCheck: check
    }
  });
});

// PUT update breeding record
router.put('/:id', checkEditPermission('breeding_records'), (req, res) => {
  const { id } = req.params;
  const { mating_date, method, status, notes } = req.body;
  db.run(`
    UPDATE breeding_records SET
      mating_date = COALESCE(?, mating_date),
      method = COALESCE(?, method),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `, [mating_date, method, status, notes, id]);
  db.save();
  res.json({ status: 'success', message: 'Breeding record updated' });
});

// DELETE breeding record
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM breeding_records WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Breeding record deleted' });
});

module.exports = router;
