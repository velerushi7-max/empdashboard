const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database/employee_management.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`ALTER TABLE admins ADD COLUMN created_at TEXT`, (err) => {
        if (err) console.log('Error adding created_at:', err.message);
        else console.log('created_at added successfully');
    });
    
    // Set some default date
    db.run(`UPDATE admins SET created_at = ? WHERE created_at IS NULL`, [new Date().toISOString()]);
});

db.close();
