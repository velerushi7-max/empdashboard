const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database/employee_management.db');
const db = new sqlite3.Database(dbPath);

db.all(`PRAGMA table_info(admins)`, (err, rows) => {
    if (err) console.error(err);
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
