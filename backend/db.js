/**
 * Database layer for the Goat Farm Management System.
 * Uses sql.js (pure-JS WASM SQLite) — relational, no native compilation required.
 * The DB file persists on disk so data survives restarts.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'goatfarm.db');
const DB_DIR = path.dirname(DB_PATH);

let SQL = null;
let db = null;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function save() {
  if (!db) return;
  ensureDir();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function load() {
  if (!SQL) return;
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }
}

async function init() {
  SQL = await initSqlJs();
  load();

  // Run schema and seed
  const { schemaSql } = require('./schema');
  const { seedDatabase } = require('./seedData');
  db.run(schemaSql);
  seedDatabase();
  save();

  // Save periodically (every 30s) and on exit.
  setInterval(save, 30000);
  process.on('exit', save);
  process.on('SIGINT', () => { save(); process.exit(0); });
  process.on('SIGTERM', () => { save(); process.exit(0); });
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// ---- Query helpers -------------------------------------------------------

/**
 * sql.js's binder throws "Wrong API use" on `undefined` values (e.g. from a
 * destructured req.body field that wasn't sent in a partial update). SQL NULL
 * is the correct representation, so normalize here once for every caller
 * instead of requiring every route to remember `field || null`.
 */
function sanitizeParams(params) {
  return params.map((p) => (p === undefined ? null : p));
}

function run(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  try {
    stmt.run(sanitizeParams(params));
    const changes = d.getRowsModified();
    // sql.js's Statement has no getInsertId() method (that was never a real
    // sql.js API — it always returned undefined, so every INSERT in this
    // app was silently reporting lastInsertId: null). Pull the real id via
    // SQLite's last_insert_rowid(), which reflects the most recent INSERT
    // on this connection; safe here since all DB access is synchronous.
    let lastId = null;
    if (/^\s*insert/i.test(sql)) {
      const idResult = d.exec('SELECT last_insert_rowid() AS id');
      if (idResult.length && idResult[0].values.length) {
        lastId = idResult[0].values[0][0];
      }
    }
    stmt.free();
    return { changes, lastInsertId: lastId };
  } finally {
    stmt.free();
  }
}

function get(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  try {
    stmt.bind(sanitizeParams(params));
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } finally {
    stmt.free();
  }
}

function all(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  const rows = [];
  try {
    stmt.bind(sanitizeParams(params));
    while (stmt.step()) rows.push(stmt.getAsObject());
  } finally {
    stmt.free();
  }
  return rows;
}

function exec(sql) {
  getDb().run(sql);
}

function transaction(fn) {
  const d = getDb();
  d.run('BEGIN');
  try {
    const result = fn();
    d.run('COMMIT');
    return result;
  } catch (e) {
    d.run('ROLLBACK');
    throw e;
  }
}

module.exports = { init, getDb, run, get, all, exec, transaction, save };