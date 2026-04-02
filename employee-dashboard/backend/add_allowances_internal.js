const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addAllowances() {
    console.log("--- ADDING ALLOWANCES COLUMN (Internal) ---");
    try {
        await db.execute("ALTER TABLE payroll ADD COLUMN allowances INTEGER DEFAULT 0");
        console.log("Column added successfully");
    } catch (err) {
        if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
            console.log("Column already exists");
        } else {
            console.error("Migration error:", err.message);
        }
    }
}
addAllowances();
