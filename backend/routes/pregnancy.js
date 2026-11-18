/**
 * Pregnancy Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const breedingService = require('../services/breeding');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

function calculateDaysRemaining(expectedDeliveryDate) {
  if (!expectedDeliveryDate) return 0;
  const delivery = new Date(expectedDeliveryDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  delivery.setHours(0,0,0,0);
  const diffTime = delivery.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// GET all pregnancy records with days remaining
router.get('/', (req, res) => {
  const pregnancies = db.all(`
    SELECT p.*,
      g.id as goat_id, g.name as goat_name, g.breed, g.photo_url, g.qr_code_id,
      b.mating_date, b.method as breeding_method,
      buck.id as father_id, buck.name as father_name
    FROM pregnancy_records p
    JOIN goats g ON p.goat_id = g.id
    LEFT JOIN breeding_records b ON p.breeding_id = b.id
    LEFT JOIN goats buck ON b.male_id = buck.id
    ORDER BY p.expected_delivery_date ASC
  `).map(p => {
    const daysRemaining = calculateDaysRemaining(p.expected_delivery_date);
    return {
      ...p,
      days_remaining: daysRemaining,
      is_overdue: daysRemaining < 0 && p.status === 'Pregnant',
      days_overdue: daysRemaining < 0 ? Math.abs(daysRemaining) : 0
    };
  });

  res.json({ status: 'success', data: pregnancies });
});

// GET pregnancy alerts (upcoming delivery in <= 14 days or overdue)
router.get('/alerts', (req, res) => {
  const allPregnancies = db.all(`
    SELECT p.*, g.name as goat_name, g.qr_code_id
    FROM pregnancy_records p
    JOIN goats g ON p.goat_id = g.id
    WHERE p.status = 'Pregnant'
  `);

  const alerts = [];
  allPregnancies.forEach(p => {
    const days = calculateDaysRemaining(p.expected_delivery_date);
    if (days < 0) {
      alerts.push({
        id: p.id,
        goat_name: p.goat_name,
        type: 'overdue',
        severity: 'high',
        message: `Overdue Delivery! Goat ${p.goat_name} was expected on ${p.expected_delivery_date} (${Math.abs(days)} days past due).`
      });
    } else if (days <= 14) {
      alerts.push({
        id: p.id,
        goat_name: p.goat_name,
        type: 'upcoming_delivery',
        severity: 'medium',
        message: `Upcoming Delivery: Goat ${p.goat_name} is due in ${days} days (${p.expected_delivery_date}).`
      });
    }
  });

  res.json({ status: 'success', data: alerts });
});

// POST Record new pregnancy confirmation
router.post('/', (req, res) => {
  const { breeding_id, goat_id, confirmation_date, expected_delivery_date, health_status, notes } = req.body;

  if (!goat_id) {
    return res.status(400).json({ status: 'error', message: 'goat_id is required' });
  }

  let finalDeliveryDate = expected_delivery_date;
  if (!finalDeliveryDate && breeding_id) {
    const breeding = db.get('SELECT mating_date FROM breeding_records WHERE id = ?', [breeding_id]);
    if (breeding) {
      finalDeliveryDate = breedingService.calculateDeliveryDate(breeding.mating_date);
    }
  }

  if (!finalDeliveryDate) {
    finalDeliveryDate = breedingService.calculateDeliveryDate(new Date().toISOString().split('T')[0]);
  }

  const { lastInsertId } = db.run(`
    INSERT INTO pregnancy_records (breeding_id, goat_id, confirmation_date, expected_delivery_date, status, health_status, notes)
    VALUES (?, ?, ?, ?, 'Pregnant', ?, ?)
  `, [
    breeding_id || null, goat_id, confirmation_date || new Date().toISOString().split('T')[0],
    finalDeliveryDate, health_status || 'Good', notes || ''
  ]);

  // Update goat breeding status
  db.run("UPDATE goats SET breeding_status = 'Pregnant' WHERE id = ?", [goat_id]);
  db.save();

  res.status(201).json({ status: 'success', data: { id: lastInsertId, expected_delivery_date: finalDeliveryDate } });
});

// PUT Update pregnancy record
router.put('/:id', checkEditPermission('pregnancy_records', 'id'), (req, res) => {
  const { id } = req.params;
  const { status, health_status, notes, expected_delivery_date } = req.body;

  db.run(`
    UPDATE pregnancy_records SET
      status = COALESCE(?, status),
      health_status = COALESCE(?, health_status),
      notes = COALESCE(?, notes),
      expected_delivery_date = COALESCE(?, expected_delivery_date)
    WHERE id = ?
  `, [status, health_status, notes, expected_delivery_date, id]);

  db.save();
  res.json({ status: 'success', message: 'Pregnancy record updated' });
});

// DELETE pregnancy record (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM pregnancy_records WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Pregnancy record deleted' });
});

module.exports = router;
