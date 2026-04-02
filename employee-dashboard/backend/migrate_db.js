require('dotenv').config();
const { db } = require('./db');

async function migrate() {
    console.log("--- MIGRATING DB ---");
    try {
        await db.execute("DROP TABLE IF EXISTS payroll");
        console.log("Dropped old payroll table");
    } catch (err) {
        console.error(err);
    }
}
migrate();
