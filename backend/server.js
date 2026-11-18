/**
 * Express server entry point.
 */
'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const os = require('os');
const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Origins used by the web app and the Android app (Capacitor serves from
// https://localhost). Set CORS_ORIGIN to a comma-separated whitelist in
// production; when it is unset any origin is allowed (useful for LAN testing).
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  ...configuredOrigins,
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.length === 0 || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '5mb' })); // goat photos are sent as resized data URLs
app.use(cookieParser());

// Initialize DB then start server
db.init().then(() => {
  // WhatsApp support was removed: drop its leftover settings so they no longer show in Settings.
  if (db.get("SELECT key FROM farm_settings WHERE key LIKE 'whatsapp\\_%' ESCAPE '\\' LIMIT 1")) {
    db.run("DELETE FROM farm_settings WHERE key LIKE 'whatsapp\\_%' ESCAPE '\\'");
    db.save();
  }

  // Liveness check. Must not be '/api/health': that path belongs to the
  // Health & Vaccination routes and a handler here would shadow their list endpoint.
  app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

  // Auth
  app.use('/api/auth', authRoutes);

  // Core domain routes
  app.use('/api/goats', require('./routes/goats'));
  app.use('/api/breeding', require('./routes/breeding'));
  app.use('/api/pregnancy', require('./routes/pregnancy'));
  app.use('/api/deliveries', require('./routes/deliveries'));
  app.use('/api/kiddings', require('./routes/kiddings'));
  app.use('/api/health', require('./routes/health'));
  app.use('/api/finance', require('./routes/finance'));
  app.use('/api/feeding', require('./routes/feeding'));
  app.use('/api/calendar', require('./routes/calendar'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/breeds', require('./routes/breeds'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/genealogy', require('./routes/genealogy'));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API running on port ${PORT}`);
    console.log(`  Web:   http://localhost:${PORT}/api`);

    const interfaces = os.networkInterfaces();
    Object.entries(interfaces).forEach(([name, addresses]) => {
      (addresses || [])
        .filter((net) => net.family === 'IPv4' && !net.internal)
        .forEach((net) => {
          console.log(`  Phone (${name}): http://${net.address}:${PORT}/api`);
        });
    });
  });
}).catch(err => {
  console.error('Failed to initialize DB', err);
  process.exit(1);
});