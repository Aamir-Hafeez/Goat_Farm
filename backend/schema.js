/**
 * Full Database Schema for Goat Farm Management System.
 */
'use strict';

const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'farm_worker',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS goats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    qr_code_id TEXT UNIQUE,
    photo_url TEXT,
    breed TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
    dob DATE,
    weight REAL,
    color TEXT,
    purchase_date DATE,
    purchase_price REAL,
    father_id INTEGER,
    mother_id INTEGER,
    health_status TEXT DEFAULT 'Healthy',
    breeding_status TEXT DEFAULT 'Eligible',
    current_location TEXT DEFAULT 'Main Barn',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(father_id) REFERENCES goats(id),
    FOREIGN KEY(mother_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS heat_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goat_id INTEGER NOT NULL,
    heat_date DATE NOT NULL,
    next_expected_heat DATE,
    status TEXT DEFAULT 'observed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS breeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    female_id INTEGER NOT NULL,
    male_id INTEGER NOT NULL,
    mating_date DATE NOT NULL,
    method TEXT DEFAULT 'Natural',
    status TEXT DEFAULT 'Pending',
    heat_cycle_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(female_id) REFERENCES goats(id),
    FOREIGN KEY(male_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS pregnancy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    breeding_id INTEGER NOT NULL,
    goat_id INTEGER NOT NULL,
    confirmation_date DATE,
    expected_delivery_date DATE NOT NULL,
    status TEXT DEFAULT 'Pregnant',
    health_status TEXT DEFAULT 'Good',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(breeding_id) REFERENCES breeding_records(id),
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregnancy_id INTEGER,
    mother_id INTEGER NOT NULL,
    father_id INTEGER,
    delivery_date DATE NOT NULL,
    num_kids INTEGER DEFAULT 1,
    male_kids INTEGER DEFAULT 0,
    female_kids INTEGER DEFAULT 0,
    delivery_type TEXT DEFAULT 'Normal',
    mother_health TEXT DEFAULT 'Good',
    kids_health TEXT DEFAULT 'Healthy',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(pregnancy_id) REFERENCES pregnancy_records(id),
    FOREIGN KEY(mother_id) REFERENCES goats(id),
    FOREIGN KEY(father_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS offspring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    goat_id INTEGER NOT NULL,
    birth_weight REAL,
    current_weight REAL,
    weaning_date DATE,
    sale_status TEXT DEFAULT 'Available',
    sale_price REAL,
    sale_date DATE,
    breeding_eligible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(delivery_id) REFERENCES deliveries(id),
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goat_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    disease TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medicines TEXT,
    dosage TEXT,
    vet_name TEXT,
    date DATE NOT NULL,
    next_checkup_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS vaccinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goat_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    next_due_date DATE,
    status TEXT DEFAULT 'Completed',
    administered_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS feed_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Forage',
    stock_kg REAL NOT NULL DEFAULT 0,
    min_stock_kg REAL DEFAULT 50,
    unit_cost REAL DEFAULT 0,
    supplier TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_id INTEGER,
    goat_id INTEGER,
    group_name TEXT,
    feed_type TEXT NOT NULL,
    amount_kg REAL NOT NULL,
    cost REAL DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(feed_id) REFERENCES feed_inventory(id),
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS financials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    goat_id INTEGER,
    reference_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goat_id INTEGER,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goat_id) REFERENCES goats(id)
  );

  CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS farm_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

module.exports = { schemaSql };
