/**
 * Genealogy & Family Tree routes.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET full genealogy tree for a goat (recursive, configurable generations)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const maxGens = parseInt(req.query.max_generations, 10) || 4;

  const buildNode = (goatId, depth) => {
    if (!goatId || depth <= 0) return null;
    const g = db.get('SELECT id, name, breed, gender, dob, photo_url, father_id, mother_id FROM goats WHERE id = ?', [goatId]);
    if (!g) return null;
    return {
      ...g,
      father: buildNode(g.father_id, depth - 1),
      mother: buildNode(g.mother_id, depth - 1),
      children: db.all('SELECT id, name, breed, gender, dob FROM goats WHERE father_id = ? OR mother_id = ?', [goatId, goatId])
    };
  };

  const tree = buildNode(parseInt(id, 10), maxGens);
  if (!tree) return res.status(404).json({ status: 'error', message: 'Goat not found' });
  res.json({ status: 'success', data: tree });
});

// GET siblings / related goats
router.get('/:id/related', (req, res) => {
  const { id } = req.params;
  const goat = db.get('SELECT father_id, mother_id FROM goats WHERE id = ?', [id]);
  if (!goat) return res.status(404).json({ status: 'error', message: 'Goat not found' });
  const related = db.all(`
    SELECT g.id, g.name, g.breed, g.gender, g.dob,
      CASE WHEN g.father_id = ? AND g.mother_id = ? THEN 'Full Sibling'
           WHEN g.father_id = ? THEN 'Paternal Half Sibling'
           WHEN g.mother_id = ? THEN 'Maternal Half Sibling'
           ELSE 'Related' END as relationship
    FROM goats g
    WHERE (g.father_id = ? OR g.mother_id = ?) AND g.id != ?
  `, [goat.father_id, goat.mother_id, goat.father_id, goat.mother_id, goat.father_id, goat.mother_id, id]);
  res.json({ status: 'success', data: related });
});

module.exports = router;