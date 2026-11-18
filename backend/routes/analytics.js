/**
 * Breeding Performance Analytics routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET individual goat scorecard
router.get('/goat/:id', (req, res) => {
  const { id } = req.params;
  const goat = db.get('SELECT * FROM goats WHERE id = ?', [id]);
  if (!goat) return res.status(404).json({ status: 'error', message: 'Goat not found' });

  const totalMating = db.get('SELECT COUNT(*) as c FROM breeding_records WHERE female_id = ?', [id]).c;
  const successful = db.get("SELECT COUNT(*) as c FROM breeding_records WHERE female_id = ? AND status = 'Successful'", [id]).c;
  const failed = db.get("SELECT COUNT(*) as c FROM breeding_records WHERE female_id = ? AND status = 'Failed'", [id]).c;
  const totalPregnancies = db.get('SELECT COUNT(*) as c FROM pregnancy_records WHERE goat_id = ?', [id]).c;
  const totalDeliveries = db.get('SELECT COUNT(*) as c FROM deliveries WHERE mother_id = ?', [id]).c;
  const totalKids = db.get('SELECT COALESCE(SUM(num_kids),0) as v FROM deliveries WHERE mother_id = ?', [id]).v;
  const maleKids = db.get('SELECT COALESCE(SUM(male_kids),0) as v FROM deliveries WHERE mother_id = ?', [id]).v;
  const femaleKids = db.get('SELECT COALESCE(SUM(female_kids),0) as v FROM deliveries WHERE mother_id = ?', [id]).v;
  const avgKids = totalDeliveries > 0 ? totalKids / totalDeliveries : 0;
  const survivalRate = totalKids > 0 ? (db.get("SELECT COUNT(*) as c FROM goats WHERE mother_id = ? AND health_status = 'Healthy'", [id]).c / totalKids) * 100 : 0;

  res.json({
    status: 'success',
    data: {
      goat_id: id, goat_name: goat.name, breed: goat.breed, gender: goat.gender,
      total_mating_attempts: totalMating, successful_matings: successful, failed_matings: failed,
      total_pregnancies: totalPregnancies, total_deliveries: totalDeliveries,
      total_kids_born: totalKids, male_kids: maleKids, female_kids: femaleKids,
      avg_kids_per_delivery: avgKids.toFixed(2), kid_survival_rate: survivalRate.toFixed(1)
    }
  });
});

// GET farm-level analytics
router.get('/farm', (req, res) => {
  const totalGoats = db.get('SELECT COUNT(*) as c FROM goats WHERE status = "active"').c;
  const totalBreedings = db.get('SELECT COUNT(*) as c FROM breeding_records').c;
  const successfulBreedings = db.get("SELECT COUNT(*) as c FROM breeding_records WHERE status = 'Successful'").c;
  const totalPregnancies = db.get("SELECT COUNT(*) as c FROM pregnancy_records WHERE status = 'Pregnant'").c;
  const totalDeliveries = db.get('SELECT COUNT(*) as c FROM deliveries').c;
  const totalKidsBorn = db.get('SELECT COALESCE(SUM(num_kids),0) as v FROM deliveries').v;
  const avgLitter = totalDeliveries > 0 ? totalKidsBorn / totalDeliveries : 0;
  const pregnancySuccessRate = totalBreedings > 0 ? (successfulBreedings / totalBreedings) * 100 : 0;
  const mortalityRate = totalGoats > 0 ? (db.get("SELECT COUNT(*) as c FROM goats WHERE status = 'dead'").c / totalGoats) * 100 : 0;

  res.json({
    status: 'success',
    data: {
      total_goats: totalGoats, total_breedings: totalBreedings, successful_breedings: successfulBreedings,
      active_pregnancies: totalPregnancies, total_deliveries: totalDeliveries, total_kids_born: totalKidsBorn,
      avg_litter_size: avgLitter.toFixed(2), pregnancy_success_rate: pregnancySuccessRate.toFixed(1),
      mortality_rate: mortalityRate.toFixed(1)
    }
  });
});

// GET male breeding performance
router.get('/male-performance', (req, res) => {
  const rows = db.all(`
    SELECT m.id, m.name, m.breed,
      COUNT(DISTINCT b.id) as matings,
      COUNT(DISTINCT p.id) as pregnancies,
      COALESCE(SUM(d.num_kids), 0) as kids
    FROM goats m
    LEFT JOIN breeding_records b ON b.male_id = m.id
    LEFT JOIN pregnancy_records p ON p.breeding_id = b.id
    LEFT JOIN deliveries d ON d.mother_id = p.goat_id
    WHERE m.gender = 'male'
    GROUP BY m.id
    ORDER BY matings DESC
  `);
  res.json({ status: 'success', data: rows });
});

// GET female fertility comparison
router.get('/female-fertility', (req, res) => {
  const rows = db.all(`
    SELECT f.id, f.name, f.breed,
      COUNT(DISTINCT b.id) as matings,
      COUNT(DISTINCT p.id) as pregnancies,
      COUNT(DISTINCT d.id) as deliveries,
      COALESCE(SUM(d.num_kids), 0) as kids
    FROM goats f
    LEFT JOIN breeding_records b ON b.female_id = f.id
    LEFT JOIN pregnancy_records p ON p.goat_id = f.id
    LEFT JOIN deliveries d ON d.mother_id = f.id
    WHERE f.gender = 'female'
    GROUP BY f.id
    ORDER BY kids DESC
  `);
  res.json({ status: 'success', data: rows });
});

// GET offspring growth comparison
router.get('/growth', (req, res) => {
  const rows = db.all(`
    SELECT g.id, g.name, g.breed, g.gender, g.dob, g.weight,
      o.birth_weight, o.current_weight, o.weaning_date
    FROM goats g
    JOIN offspring o ON o.goat_id = g.id
    ORDER BY g.dob DESC
  `);
  res.json({ status: 'success', data: rows });
});

module.exports = router;