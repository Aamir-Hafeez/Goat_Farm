/**
 * Reports routes (PDF/Excel export endpoints).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET farm summary report
router.get('/summary', (req, res) => {
  const totalGoats = db.get('SELECT COUNT(*) as c FROM goats WHERE status = "active"').c;
  const male = db.get("SELECT COUNT(*) as c FROM goats WHERE gender = 'male' AND status = 'active'").c;
  const female = db.get("SELECT COUNT(*) as c FROM goats WHERE gender = 'female' AND status = 'active'").c;
  const pregnant = db.get("SELECT COUNT(*) as c FROM goats WHERE breeding_status = 'Pregnant'").c;
  const ready = db.get("SELECT COUNT(*) as c FROM goats WHERE breeding_status = 'Eligible'").c;
  const inHeat = db.get("SELECT COUNT(*) as c FROM goats WHERE breeding_status = 'In Heat'").c;
  const kids = db.get("SELECT COUNT(*) as c FROM goats WHERE breeding_status = 'Kid / Growing'").c;
  const mortality = db.get("SELECT COUNT(*) as c FROM goats WHERE status = 'dead'").c;
  const totalIncome = db.get("SELECT COALESCE(SUM(amount),0) as v FROM financials WHERE type = 'income'").v;
  const totalExpense = db.get("SELECT COALESCE(SUM(amount),0) as v FROM financials WHERE type = 'expense'").v;
  const totalKidsBorn = db.get("SELECT COALESCE(SUM(num_kids),0) as v FROM deliveries").v;
  const healthyKids = db.get("SELECT COUNT(*) as c FROM goats WHERE health_status = 'Healthy' AND breeding_status = 'Kid / Growing'").c;

  // Fetch upcoming events from calendar
  const upcomingEvents = db.all("SELECT title, event_date as date FROM calendar_events WHERE event_date >= date('now') ORDER BY event_date ASC LIMIT 5");

  // Fetch recent activities
  const recentActivities = [];
  const deliveries = db.all("SELECT id, mother_id, delivery_date, num_kids FROM deliveries ORDER BY delivery_date DESC LIMIT 3");
  deliveries.forEach(d => {
    const m = db.get('SELECT name FROM goats WHERE id = ?', [d.mother_id]);
    recentActivities.push({ type: 'delivery', date: d.delivery_date, description: `${m ? m.name : 'Goat #'+d.mother_id} birthed ${d.num_kids} kid(s)` });
  });

  // Critical alerts (low stock or overdue)
  const criticalAlerts = db.all("SELECT name || ' stock is low (' || stock_kg || 'kg)' as message FROM feed_inventory WHERE stock_kg <= min_stock_kg");

  res.json({
    status: 'success',
    data: {
      total_goats: totalGoats, male_goats: male, female_goats: female,
      pregnant_goats: pregnant, ready_for_breeding: ready, in_heat: inHeat,
      total_kids: kids, goat_mortality: mortality,
      total_income: totalIncome, total_expenses: totalExpense,
      net_profit: totalIncome - totalExpense, total_kids_born: totalKidsBorn,
      healthy_kids: healthyKids,
      upcoming_events: upcomingEvents,
      recent_activities: recentActivities,
      critical_alerts: criticalAlerts
    }
  });
});

// GET monthly birth statistics
router.get('/monthly-births', (req, res) => {
  const rows = db.all(`
    SELECT strftime('%Y-%m', delivery_date) as month, COUNT(*) as deliveries, SUM(num_kids) as kids
    FROM deliveries
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  res.json({ status: 'success', data: rows });
});

// GET breeding success rate
router.get('/breeding-success', (req, res) => {
  const total = db.get('SELECT COUNT(*) as c FROM breeding_records').c;
  const successful = db.get("SELECT COUNT(*) as c FROM breeding_records WHERE status = 'Successful'").c;
  const pregnant = db.get("SELECT COUNT(*) as c FROM pregnancy_records WHERE status = 'Pregnant'").c;
  const delivered = db.get("SELECT COUNT(*) as c FROM deliveries").c;
  const successRate = total > 0 ? (successful / total) * 100 : 0;
  res.json({ status: 'success', data: { total_breeding_records: total, successful: successful, pregnancy_rate: successRate, active_pregnancies: pregnant, total_deliveries: delivered } });
});

// GET breed-wise performance
router.get('/breed-performance', (req, res) => {
  const rows = db.all(`
    SELECT g.breed,
      COUNT(DISTINCT g.id) as goats,
      COUNT(DISTINCT p.id) as pregnancies,
      COALESCE(SUM(d.num_kids), 0) as kids_born
    FROM goats g
    LEFT JOIN pregnancy_records p ON p.goat_id = g.id
    LEFT JOIN deliveries d ON d.mother_id = g.id
    GROUP BY g.breed
    ORDER BY goats DESC
  `);
  res.json({ status: 'success', data: rows });
});

// GET financial P&L by month
router.get('/monthly-financials', (req, res) => {
  const rows = db.all(`
    SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM financials
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  res.json({ status: 'success', data: rows });
});

// GET recent activities
router.get('/activities', (req, res) => {
  const activities = [];
  const deliveries = db.all("SELECT id, mother_id, delivery_date, num_kids FROM deliveries ORDER BY delivery_date DESC LIMIT 5");
  deliveries.forEach(d => {
    const m = db.get('SELECT name FROM goats WHERE id = ?', [d.mother_id]);
    activities.push({ type: 'delivery', date: d.delivery_date, description: `${m ? m.name : 'Goat #'+d.mother_id} birthed ${d.num_kids} kid(s)` });
  });
  const breedings = db.all("SELECT id, female_id, male_id, mating_date FROM breeding_records ORDER BY mating_date DESC LIMIT 5");
  breedings.forEach(b => {
    const f = db.get('SELECT name FROM goats WHERE id = ?', [b.female_id]);
    const m = db.get('SELECT name FROM goats WHERE id = ?', [b.male_id]);
    activities.push({ type: 'breeding', date: b.mating_date, description: `${f ? f.name : 'Doe'} x ${m ? m.name : 'Buck'} mating recorded` });
  });
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ status: 'success', data: activities.slice(0, 10) });
});

router.get('/export/pdf', (req, res) => {
  res.json({ status: 'success', message: 'Use browser print to generate PDF from the report page' });
});

router.get('/export/excel', (req, res) => {
  res.json({ status: 'success', message: 'Excel export available on client side' });
});

module.exports = router;
