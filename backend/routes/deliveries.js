/**
 * Kidding & Deliveries Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

const DEFAULT_GOAT_PHOTO = 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=400&q=80';

// GET all delivery records
router.get('/', (req, res) => {
  const deliveries = db.all(`
    SELECT d.*,
      m.name as mother_name, m.breed as mother_breed, m.photo_url as mother_photo,
      f.name as father_name, f.breed as father_breed
    FROM deliveries d
    JOIN goats m ON d.mother_id = m.id
    LEFT JOIN goats f ON d.father_id = f.id
    ORDER BY d.delivery_date DESC
  `).map(d => {
    // Fetch individual offspring for this delivery
    const kids = db.all(`
      SELECT o.*, g.name as kid_name, g.gender, g.qr_code_id, g.photo_url
      FROM offspring o
      JOIN goats g ON o.goat_id = g.id
      WHERE o.delivery_id = ?
    `, [d.id]);
    return { ...d, kids };
  });

  res.json({ status: 'success', data: deliveries });
});

// POST Record new delivery and auto-create kid goat profiles!
router.post('/', (req, res) => {
  const {
    pregnancy_id, mother_id, father_id, delivery_date,
    num_kids, male_kids, female_kids, delivery_type,
    mother_health, kids_health, notes, kids_data
  } = req.body;

  if (!mother_id || !delivery_date) {
    return res.status(400).json({ status: 'error', message: 'mother_id and delivery_date are required' });
  }

  const mother = db.get('SELECT * FROM goats WHERE id = ?', [mother_id]);
  if (!mother) return res.status(404).json({ status: 'error', message: 'Mother goat not found' });

  const totalKidsCount = parseInt(num_kids, 10) || ((parseInt(male_kids, 10) || 0) + (parseInt(female_kids, 10) || 0)) || 1;
  const numMale = parseInt(male_kids, 10) || 0;
  const numFemale = parseInt(female_kids, 10) || (totalKidsCount - numMale);

  // Every newborn must be registered with a picture.
  if (!Array.isArray(kids_data) || kids_data.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Add each kid with a picture to record a delivery' });
  }
  if (kids_data.some(k => !k || !k.photo_url)) {
    return res.status(400).json({ status: 'error', message: 'A picture is required for every kid' });
  }

  // Note: db.save() (sql.js export) cannot run while a transaction is open,
  // so it — and the response — must happen after the transaction commits,
  // not inside the callback.
  const { deliveryId, createdKids } = db.transaction(() => {
    // 1. Create delivery record
    const { lastInsertId: deliveryId } = db.run(`
      INSERT INTO deliveries (
        pregnancy_id, mother_id, father_id, delivery_date,
        num_kids, male_kids, female_kids, delivery_type,
        mother_health, kids_health, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pregnancy_id || null, mother_id, father_id || null, delivery_date,
      totalKidsCount, numMale, numFemale, delivery_type || 'Normal',
      mother_health || 'Good', kids_health || 'Healthy', notes || ''
    ]);

    // 2. Update pregnancy record status if pregnancy_id provided
    if (pregnancy_id) {
      db.run("UPDATE pregnancy_records SET status = 'Delivered' WHERE id = ?", [pregnancy_id]);
    } else {
      // Find open pregnancy for this mother
      const openPreg = db.get("SELECT id FROM pregnancy_records WHERE goat_id = ? AND status = 'Pregnant'", [mother_id]);
      if (openPreg) {
        db.run("UPDATE pregnancy_records SET status = 'Delivered' WHERE id = ?", [openPreg.id]);
      }
    }

    // 3. Update Mother's breeding status to Resting / Lactating
    db.run("UPDATE goats SET breeding_status = 'Lactating' WHERE id = ?", [mother_id]);

    // 4. Auto-generate newborn Goat profiles & QR codes
    const createdKids = [];

    // Construct list of kids to register
    const kidsToCreate = [];
    if (kids_data && Array.isArray(kids_data) && kids_data.length > 0) {
      kidsToCreate.push(...kids_data);
    } else {
      for (let i = 0; i < numMale; i++) {
        kidsToCreate.push({ name: `${mother.name}'s Kid M${i + 1}`, gender: 'male', weight: 3.2 });
      }
      for (let i = 0; i < numFemale; i++) {
        kidsToCreate.push({ name: `${mother.name}'s Kid F${i + 1}`, gender: 'female', weight: 3.0 });
      }
    }

    kidsToCreate.forEach((k, idx) => {
      const kidGender = k.gender || (idx < numMale ? 'male' : 'female');
      const kidName = k.name || `${mother.name}'s Kid ${kidGender === 'male' ? 'M' : 'F'}${idx + 1}`;
      const kidWeight = k.weight ? parseFloat(k.weight) : 3.0;

      const { lastInsertId: goatId } = db.run(`
        INSERT INTO goats (
          name, breed, gender, dob, weight, color,
          father_id, mother_id, health_status, breeding_status, current_location, status, photo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Healthy', 'Kid / Growing', 'Nursery Pen', 'active', ?)
      `, [
        kidName, mother.breed, kidGender, delivery_date, kidWeight,
        k.color || mother.color || 'White', father_id || null, mother_id,
        k.photo_url || DEFAULT_GOAT_PHOTO
      ]);

      const qrCodeId = `QR-GOAT-${String(goatId).padStart(3, '0')}`;
      db.run('UPDATE goats SET qr_code_id = ? WHERE id = ?', [qrCodeId, goatId]);

      // Record in offspring table
      db.run(`
        INSERT INTO offspring (delivery_id, goat_id, birth_weight, current_weight, breeding_eligible)
        VALUES (?, ?, ?, ?, 1)
      `, [deliveryId, goatId, kidWeight, kidWeight]);

      createdKids.push({ id: goatId, name: kidName, qr_code_id: qrCodeId, weight: kidWeight });
    });

    return { deliveryId, createdKids };
  });

  db.save();

  res.status(201).json({
    status: 'success',
    data: {
      delivery_id: deliveryId,
      total_kids: totalKidsCount,
      created_kids: createdKids
    }
  });
});

// PUT update delivery record (1-day edit lock for standard users)
router.put('/:id', checkEditPermission('deliveries'), (req, res) => {
  const { id } = req.params;
  const { delivery_date, num_kids, male_kids, female_kids, delivery_type, mother_health, kids_health, notes } = req.body;
  db.run(`
    UPDATE deliveries SET
      delivery_date = COALESCE(?, delivery_date),
      num_kids = COALESCE(?, num_kids),
      male_kids = COALESCE(?, male_kids),
      female_kids = COALESCE(?, female_kids),
      delivery_type = COALESCE(?, delivery_type),
      mother_health = COALESCE(?, mother_health),
      kids_health = COALESCE(?, kids_health),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `, [delivery_date, num_kids, male_kids, female_kids, delivery_type, mother_health, kids_health, notes, id]);
  db.save();
  res.json({ status: 'success', message: 'Delivery record updated' });
});

// DELETE delivery record (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM deliveries WHERE id = ?', [req.params.id]);
  db.save();
  res.json({ status: 'success', message: 'Delivery record deleted' });
});

module.exports = router;
