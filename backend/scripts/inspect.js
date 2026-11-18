const db = require('../db');
db.init().then(d => {
  const rows = d.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  console.log(rows.map(r => r.sql).join('\n'));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });