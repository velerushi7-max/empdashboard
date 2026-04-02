const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database/employee_management.db');
const db = new sqlite3.Database(dbPath);

const tables = [
    {
        name: 'admins',
        columns: [
            'phone_number TEXT',
            'department TEXT',
            'joining_date TEXT',
            'status TEXT DEFAULT "Active"',
            'address TEXT'
        ]
    },
    {
        name: 'salaries',
        schema: `CREATE TABLE IF NOT EXISTS salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            base_salary REAL NOT NULL,
            bonuses REAL DEFAULT 0,
            deductions REAL DEFAULT 0,
            net_salary REAL NOT NULL,
            payment_date TEXT,
            bank_details TEXT,
            FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE
        )`
    }
];

db.serialize(() => {
    // Add columns to admins
    tables[0].columns.forEach(col => {
        const colName = col.split(' ')[0];
        db.run(`ALTER TABLE admins ADD COLUMN ${col}`, (err) => {
            if (err) {
                console.log(`Column ${colName} might already exist or failed:`, err.message);
            } else {
                console.log(`Column ${colName} added successfully.`);
            }
        });
    });

    // Create salaries table
    db.run(tables[1].schema, (err) => {
        if (err) console.error('Error creating salaries table:', err.message);
        else console.log('Salaries table ready.');
    });
});

db.close();
