const { db } = require('./db');
const bcrypt = require('bcryptjs');

async function setup() {
    try {
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        // 1. Create Manager
        const mRes = await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: ["Test Manager", "testmanager@example.com", hashedPassword, "Manager"]
        });
        const managerId = Number(mRes.lastInsertRowid);
        console.log('Created Manager with ID:', managerId);

        // 2. Create Employee
        const eRes = await db.execute({
            sql: "INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)",
            args: ["Test Employee", "testemployee@example.com", hashedPassword, "Employee", managerId]
        });
        const employeeId = Number(eRes.lastInsertRowid);
        console.log('Created Employee with ID:', employeeId);

        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
