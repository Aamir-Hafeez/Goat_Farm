/**
 * Schema migration script for the Goat Farm Management System.
 * Idempotent: uses CREATE TABLE IF NOT EXISTS.
 */
'use strict';

const db = require('../db');

async function migrate() {
  console.log('Running migrations...');

  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'farm_worker',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS goats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      qr_code_id TEXT UNIQUE,
      photo_url TEXT,
      breed TEXT,
      gender TEXT CHECK(gender IN ('male', 'female')),
      dob DATE,
      weight REAL,
      color TEXT,
      father_id INTEGER,
      mother_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(father_id) REFERENCES goats(id),
      FOREIGN KEY(mother_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS breeding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      female_id INTEGER NOT NULL,
      male_id INTEGER NOT NULL,
      mating_date DATE NOT NULL,
      method TEXT,
      status TEXT DEFAULT 'pending',
      heat_cycle_id INTEGER,
      notes TEXT,
      FOREIGN KEY(female_id) REFERENCES goats(id),
      FOREIGN KEY(male_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS pregnancy_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      breeding_id INTEGER NOT NULL,
      confirmation_date DATE,
      status TEXT DEFAULT 'confirmed',
      expected_delivery_date DATE,
      FOREIGN KEY(breeding_id) REFERENCES breeding_records(id)
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pregnancy_id INTEGER,
      delivery_date DATE NOT NULL,
      num_kids INTEGER DEFAULT 0,
      male_kids INTEGER DEFAULT 0,
      female_kids INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(pregnancy_id) REFERENCES pregnancy_records(id)
    );

    CREATE TABLE IF NOT EXISTS offspring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER NOT NULL,
      goat_id INTEGER NOT NULL,
      birth_weight REAL,
      FOREIGN KEY(delivery_id) REFERENCES deliveries(id),
      FOREIGN KEY(goat_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goat_id INTEGER NOT NULL,
      type TEXT,
      description TEXT,
      date DATE,
      next_checkup_date DATE,
      FOREIGN KEY(goat_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goat_id INTEGER NOT NULL,
      name TEXT,
      date DATE,
      next_due_date DATE,
      FOREIGN KEY(goat_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS feeding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goat_id INTEGER NOT NULL,
      feed_type TEXT,
      amount REAL,
      date DATE,
      FOREIGN KEY(goat_id) REFERENCES goats(id)
    );

    CREATE TABLE IF NOT EXISTS financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')),
      category TEXT,
      amount REAL,
      date DATE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      target_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await db.init();
  db.exec(sql);
  db.save();
  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});