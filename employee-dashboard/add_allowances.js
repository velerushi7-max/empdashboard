const { db } = require('./backend/db');
require('dotenv').config({ path: './backend/.env' });

async function addAllowances() {
    console.log("--- ADDING ALLOWANCES COLUMN ---");
    try {
        await db.execute("ALTER TABLE payroll ADD COLUMN allowances INTEGER DEFAULT 0");
        console.log("Column added successfully or already exists");
    } catch (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("Column already exists");
        } else {
            console.error("Migration error:", err.message);
        }
    }
}
addAllowances();
