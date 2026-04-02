require('dotenv').config({ path: './backend/.env' });
const { db } = require('./backend/db');

async function migrate() {
    console.log("--- MIGRATING DB ---");
    try {
        await db.execute("DROP TABLE IF EXISTS payroll");
        console.log("Dropped old payroll table");
        console.log("Table will be recreated by server.js with new schema.");
    } catch (err) {
        console.error(err);
    }
}
migrate();
