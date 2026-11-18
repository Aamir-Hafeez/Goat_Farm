/**
 * Goat Management routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const QRCode = require('qrcode');
const { authenticateToken, checkEditPermission, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// Helper to calculate age from DOB string
function calculateAge(dobString) {
  if (!dobString) return 'Unknown';
  const dob = new Date(dobString);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  return `${years} yr${years !== 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''}`;
}

// GET all goats with optional filtering
router.get('/', (req, res) => {
  const { search, breed, gender, status, breeding_status } = req.query;

  let sql = `
    SELECT g.*,
      f.name as father_name,
      m.name as mother_name,
      (SELECT COUNT(*) FROM offspring o JOIN deliveries d ON o.delivery_id = d.id WHERE d.mother_id = g.id OR d.father_id = g.id) as total_kids
    FROM goats g
    LEFT JOIN goats f ON g.father_id = f.id
    LEFT JOIN goats m ON g.mother_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (g.name LIKE ? OR g.qr_code_id LIKE ? OR g.breed LIKE ? OR g.id LIKE ?)`;
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (breed) {
    sql += ` AND g.breed = ?`;
    params.push(breed);
  }
  if (gender) {
    sql += ` AND g.gender = ?`;
    params.push(gender);
  }
  if (status) {
    sql += ` AND g.status = ?`;
    params.push(status);
  }
  if (breeding_status) {
    sql += ` AND g.breeding_status = ?`;
    params.push(breeding_status);
  }

  sql += ` ORDER BY g.id DESC`;

  const goats = db.all(sql, params).map(g => ({
    ...g,
    age: calculateAge(g.dob)
  }));

  res.json({ status: 'success', data: goats });
});

// GET single goat full profile
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const goat = db.get(`
    SELECT g.*, f.name as father_name, m.name as mother_name
    FROM goats g
    LEFT JOIN goats f ON g.father_id = f.id
    LEFT JOIN goats m ON g.mother_id = m.id
    WHERE g.id = ?
  `, [id]);

  if (!goat) return res.status(404).json({ status: 'error', message: 'Goat not found' });

  // Get additional details
  const breedingHistory = db.all(`
    SELECT b.*,
      CASE WHEN b.female_id = ? THEN m.name ELSE f.name END as partner_name
    FROM breeding_records b
    LEFT JOIN goats f ON b.female_id = f.id
    LEFT JOIN goats m ON b.male_id = m.id
    WHERE b.female_id = ? OR b.male_id = ?
    ORDER BY b.mating_date DESC
  `, [id, id, id]);

  const pregnancy = db.get(`
    SELECT * FROM pregnancy_records WHERE goat_id = ? AND status = 'Pregnant'
  `, [id]);

  // Records added on the Health & Vaccination page with type "Vaccination" live in
  // health_records, so they are listed under vaccinations rather than general health.
  const healthRecords = db.all(`
    SELECT * FROM health_records WHERE goat_id = ? AND type != 'Vaccination' ORDER BY date DESC
  `, [id]);

  const legacyVaccinations = db.all(`
    SELECT * FROM vaccinations WHERE goat_id = ?
  `, [id]);

  const vaccinationHealthRecords = db.all(`
    SELECT * FROM health_records WHERE goat_id = ? AND type = 'Vaccination'
  `, [id]).map(h => ({
    id: `hlt-${h.id}`,
    goat_id: h.goat_id,
    name: h.medicines || h.treatment || h.notes || 'Vaccination',
    date: h.date,
    next_due_date: h.next_checkup_date || null,
    status: 'Completed',
    administered_by: h.vet_name || null,
    notes: h.notes || null
  }));

  const vaccinations = [...legacyVaccinations, ...vaccinationHealthRecords]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const kids = db.all(`
    SELECT g.*, d.delivery_date
    FROM goats g
    JOIN deliveries d ON (g.mother_id = d.mother_id OR g.father_id = d.father_id) AND g.mother_id = ?
    ORDER BY g.dob DESC
  `, [id]);

  res.json({
    status: 'success',
    data: {
      ...goat,
      age: calculateAge(goat.dob),
      breedingHistory,
      pregnancy,
      healthRecords,
      vaccinations,
      kids
    }
  });
});

// GET QR code image data URL for goat
router.get('/:id/qr', async (req, res) => {
  const { id } = req.params;
  const goat = db.get('SELECT id, name, qr_code_id, breed, gender FROM goats WHERE id = ?', [id]);

  if (!goat) return res.status(404).json({ status: 'error', message: 'Goat not found' });

  const qrText = JSON.stringify({
    goat_id: goat.id,
    qr_code_id: goat.qr_code_id || `QR-GOAT-${String(goat.id).padStart(3, '0')}`,
    name: goat.name,
    breed: goat.breed,
    gender: goat.gender
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrText, { width: 300, margin: 2 });
    res.json({ status: 'success', data: { qr_code_id: goat.qr_code_id, qr_data_url: qrDataUrl } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to generate QR code' });
  }
});

// POST Create new goat
router.post('/', (req, res) => {
  const {
    name, breed, gender, dob, weight, color,
    purchase_date, purchase_price, father_id, mother_id,
    health_status, breeding_status, current_location, photo_url
  } = req.body;

  if (!name || !breed || !gender) {
    return res.status(400).json({ status: 'error', message: 'Name, breed, and gender are required' });
  }

  // Insert goat record
  const { lastInsertId } = db.run(`
    INSERT INTO goats (
      name, breed, gender, dob, weight, color,
      purchase_date, purchase_price, father_id, mother_id,
      health_status, breeding_status, current_location, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    name, breed, gender, dob || null, weight ? parseFloat(weight) : null, color || null,
    purchase_date || null, purchase_price ? parseFloat(purchase_price) : null,
    father_id ? parseInt(father_id) : null, mother_id ? parseInt(mother_id) : null,
    health_status || 'Healthy', breeding_status || 'Eligible', current_location || 'Main Barn',
    photo_url || 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=400&q=80'
  ]);

  const qr_code_id = `QR-GOAT-${String(lastInsertId).padStart(3, '0')}`;
  db.run('UPDATE goats SET qr_code_id = ? WHERE id = ?', [qr_code_id, lastInsertId]);
  db.save();

  res.status(201).json({ status: 'success', data: { id: lastInsertId, qr_code_id } });
});

// PUT Update goat
router.put('/:id', checkEditPermission('goats'), (req, res) => {
  const { id } = req.params;
  const {
    name, breed, gender, dob, weight, color,
    purchase_date, purchase_price, father_id, mother_id,
    health_status, breeding_status, current_location, status, photo_url
  } = req.body;

  db.run(`
    UPDATE goats SET
      name = COALESCE(?, name),
      breed = COALESCE(?, breed),
      gender = COALESCE(?, gender),
      dob = COALESCE(?, dob),
      weight = COALESCE(?, weight),
      color = COALESCE(?, color),
      purchase_date = COALESCE(?, purchase_date),
      purchase_price = COALESCE(?, purchase_price),
      father_id = COALESCE(?, father_id),
      mother_id = COALESCE(?, mother_id),
      health_status = COALESCE(?, health_status),
      breeding_status = COALESCE(?, breeding_status),
      current_location = COALESCE(?, current_location),
      status = COALESCE(?, status),
      photo_url = COALESCE(?, photo_url)
    WHERE id = ?
  `, [
    name, breed, gender, dob, weight, color,
    purchase_date, purchase_price, father_id, mother_id,
    health_status, breeding_status, current_location, status, photo_url,
    id
  ]);

  db.save();
  res.json({ status: 'success', message: 'Goat record updated successfully' });
});

// DELETE goat permanently (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const goat = db.get('SELECT id FROM goats WHERE id = ?', [id]);
  if (!goat) {
    return res.status(404).json({ status: 'error', message: 'Goat not found' });
  }

  // Remove everything that belongs to this goat, then the goat itself.
  // Foreign keys are not enforced by sql.js, so dependents are cleaned manually.
  const breedingIds = 'SELECT id FROM breeding_records WHERE female_id = ? OR male_id = ?';
  const pregnancyIds = `SELECT id FROM pregnancy_records WHERE goat_id = ? OR breeding_id IN (${breedingIds})`;
  const deliveryIds = `SELECT id FROM deliveries WHERE mother_id = ? OR pregnancy_id IN (${pregnancyIds})`;

  db.transaction(() => {
    db.run(`DELETE FROM offspring WHERE goat_id = ? OR delivery_id IN (${deliveryIds})`, [id, id, id, id, id]);
    db.run(`DELETE FROM deliveries WHERE mother_id = ? OR pregnancy_id IN (${pregnancyIds})`, [id, id, id, id]);
    db.run(`DELETE FROM pregnancy_records WHERE goat_id = ? OR breeding_id IN (${breedingIds})`, [id, id, id]);
    db.run('DELETE FROM breeding_records WHERE female_id = ? OR male_id = ?', [id, id]);
    db.run('DELETE FROM heat_cycles WHERE goat_id = ?', [id]);
    db.run('DELETE FROM health_records WHERE goat_id = ?', [id]);
    db.run('DELETE FROM vaccinations WHERE goat_id = ?', [id]);
    db.run('DELETE FROM calendar_events WHERE goat_id = ?', [id]);

    // Keep shared records, just detach them from the deleted goat.
    db.run('UPDATE deliveries SET father_id = NULL WHERE father_id = ?', [id]);
    db.run('UPDATE feeding_records SET goat_id = NULL WHERE goat_id = ?', [id]);
    db.run('UPDATE financials SET goat_id = NULL WHERE goat_id = ?', [id]);
    db.run('UPDATE goats SET father_id = NULL WHERE father_id = ?', [id]);
    db.run('UPDATE goats SET mother_id = NULL WHERE mother_id = ?', [id]);

    db.run('DELETE FROM goats WHERE id = ?', [id]);
  });
  db.save();
  res.json({ status: 'success', message: 'Goat deleted' });
});

module.exports = router;
