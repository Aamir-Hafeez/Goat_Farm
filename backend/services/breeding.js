/**
 * Breeding domain service.
 * Handles gestation math, inbreeding checks, and cycle tracking.
 */
'use strict';

const db = require('../db');

function getGestationPeriod() {
  const setting = db.get("SELECT value FROM farm_settings WHERE key = 'gestation_days'");
  return setting ? parseInt(setting.value, 10) : 150;
}

function getHeatCyclePeriod() {
  const setting = db.get("SELECT value FROM farm_settings WHERE key = 'heat_cycle_days'");
  return setting ? parseInt(setting.value, 10) : 21;
}

function getMaxInbreedingGens() {
  const setting = db.get("SELECT value FROM farm_settings WHERE key = 'max_inbreeding_generations'");
  return setting ? parseInt(setting.value, 10) : 3;
}

/**
 * Calculates expected delivery date from mating date (+150 days by default).
 */
function calculateDeliveryDate(matingDate) {
  const date = new Date(matingDate);
  date.setDate(date.getDate() + getGestationPeriod());
  return date.toISOString().split('T')[0];
}

/**
 * Calculates next expected heat cycle date (+21 days by default).
 */
function calculateNextHeat(lastHeatDate) {
  const date = new Date(lastHeatDate);
  date.setDate(date.getDate() + getHeatCyclePeriod());
  return date.toISOString().split('T')[0];
}

/**
 * Comprehensive Inbreeding Check.
 * Traces ancestry trees for both buck and doe up to specified generations.
 * Returns risk level, shared ancestors, relationship summary, and breeding decision.
 */
function checkInbreeding(maleId, femaleId, generationsOverride = null) {
  const male = db.get('SELECT * FROM goats WHERE id = ?', [maleId]);
  const female = db.get('SELECT * FROM goats WHERE id = ?', [femaleId]);

  if (!male || !female) {
    return { isSafe: false, severity: 'ERROR', message: 'Male or Female goat not found' };
  }

  // Check 1: Direct Parent-Offspring mating
  if (parseInt(female.father_id) === parseInt(maleId)) {
    return {
      isSafe: false,
      severity: 'PROHIBITED',
      relationship: 'Parent-Offspring (Sire is Doe\'s Father)',
      message: `Prohibited Breeding: ${male.name} is the father of ${female.name}!`,
      commonAncestors: [{ id: male.id, name: male.name, role: 'Father of Doe' }]
    };
  }
  if (parseInt(male.mother_id) === parseInt(femaleId)) {
    return {
      isSafe: false,
      severity: 'PROHIBITED',
      relationship: 'Parent-Offspring (Doe is Buck\'s Mother)',
      message: `Prohibited Breeding: ${female.name} is the mother of ${male.name}!`,
      commonAncestors: [{ id: female.id, name: female.name, role: 'Mother of Buck' }]
    };
  }

  // Check 2: Full Siblings (Same Father and Mother)
  if (male.father_id && female.father_id && male.father_id === female.father_id &&
      male.mother_id && female.mother_id && male.mother_id === female.mother_id) {
    return {
      isSafe: false,
      severity: 'PROHIBITED',
      relationship: 'Full Siblings (Same Parents)',
      message: `Prohibited Breeding: ${male.name} and ${female.name} are full siblings!`,
      commonAncestors: [
        { id: male.father_id, role: 'Shared Father' },
        { id: male.mother_id, role: 'Shared Mother' }
      ]
    };
  }

  // Check 3: Half Siblings
  if (male.father_id && female.father_id && male.father_id === female.father_id) {
    const father = db.get('SELECT name FROM goats WHERE id = ?', [male.father_id]);
    return {
      isSafe: false,
      severity: 'HIGH_RISK',
      relationship: `Half Siblings (Shared Father: ${father ? father.name : 'ID ' + male.father_id})`,
      message: `High Inbreeding Risk: ${male.name} and ${female.name} share the same father (${father ? father.name : male.father_id})!`,
      commonAncestors: [{ id: male.father_id, name: father ? father.name : 'Father', role: 'Shared Father' }]
    };
  }
  if (male.mother_id && female.mother_id && male.mother_id === female.mother_id) {
    const mother = db.get('SELECT name FROM goats WHERE id = ?', [male.mother_id]);
    return {
      isSafe: false,
      severity: 'HIGH_RISK',
      relationship: `Half Siblings (Shared Mother: ${mother ? mother.name : 'ID ' + male.mother_id})`,
      message: `High Inbreeding Risk: ${male.name} and ${female.name} share the same mother (${mother ? mother.name : male.mother_id})!`,
      commonAncestors: [{ id: male.mother_id, name: mother ? mother.name : 'Mother', role: 'Shared Mother' }]
    };
  }

  // Check 4: Multi-generation recursive tree analysis
  const maxGen = generationsOverride || getMaxInbreedingGens();

  const getAncestorsTree = (goatId, gen) => {
    if (!goatId || gen <= 0) return [];
    const goat = db.get('SELECT id, name, father_id, mother_id FROM goats WHERE id = ?', [goatId]);
    if (!goat) return [];

    const parents = [];
    if (goat.father_id) parents.push({ id: goat.father_id, gen: gen, relation: 'Father' });
    if (goat.mother_id) parents.push({ id: goat.mother_id, gen: gen, relation: 'Mother' });

    const further = [
      ...getAncestorsTree(goat.father_id, gen - 1),
      ...getAncestorsTree(goat.mother_id, gen - 1)
    ];

    return [...parents, ...further];
  };

  const maleAncestors = getAncestorsTree(maleId, maxGen);
  const femaleAncestors = getAncestorsTree(femaleId, maxGen);

  const maleAncestorIds = maleAncestors.map(a => a.id);
  const sharedIds = femaleAncestors.filter(a => maleAncestorIds.includes(a.id)).map(a => a.id);
  const uniqueSharedIds = [...new Set(sharedIds)];

  if (uniqueSharedIds.length > 0) {
    const commonAncestors = uniqueSharedIds.map(id => {
      const g = db.get('SELECT id, name, breed, gender FROM goats WHERE id = ?', [id]);
      return {
        id,
        name: g ? g.name : `Goat #${id}`,
        breed: g ? g.breed : '',
        role: 'Common Ancestor'
      };
    });

    return {
      isSafe: false,
      severity: 'WARNING',
      relationship: 'Shared Ancestry Detected within ' + maxGen + ' generations',
      message: `Inbreeding Warning: Shared ancestors found (${commonAncestors.map(c => c.name).join(', ')})`,
      commonAncestors
    };
  }

  return {
    isSafe: true,
    severity: 'SAFE',
    relationship: 'Unrelated / Safe Breeding Pair',
    message: 'Safe Mating Pair: No shared ancestors found within ' + maxGen + ' generations.',
    commonAncestors: []
  };
}

module.exports = {
  getGestationPeriod,
  getHeatCyclePeriod,
  calculateDeliveryDate,
  calculateNextHeat,
  checkInbreeding
};
