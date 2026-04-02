const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database/employee_management.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`ALTER TABLE admins ADD COLUMN email TEXT`, (err) => {
        if (err) console.log('Email column might already exist');
    });
    db.run(`ALTER TABLE admins ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err) console.log('created_at column might already exist');
    });
    
    // Set some default emails
    db.run(`UPDATE admins SET email = username || '@company.com' WHERE email IS NULL`);
    
    console.log('Profile columns added successfully');
});

db.close();
