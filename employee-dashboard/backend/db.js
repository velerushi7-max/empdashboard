const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error('TURSO_DATABASE_URL is not defined in .env');
    process.exit(1);
}

const db = createClient({
    url: url,
    authToken: authToken,
});

const initializeTables = async () => {
    try {
        console.log('--- INITIALIZING TURSO DATABASE TABLES (STRICT INTEGER IDs) ---');

        // 1️⃣ Users Table (INTEGER IDs)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Employee',
                manager_id INTEGER,
                phone_number TEXT,
                department TEXT,
                joining_date DATE,
                address TEXT,
                basic_salary REAL DEFAULT 0,
                status TEXT DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )
        `);

        // 🔟 Payroll Management (Enhanced)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payroll (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                basic_salary INTEGER NOT NULL DEFAULT 0,
                bonus INTEGER DEFAULT 0,
                allowances INTEGER DEFAULT 0,
                deductions INTEGER DEFAULT 0,
                net_salary INTEGER NOT NULL DEFAULT 0,
                month TEXT NOT NULL,
                year INTEGER NOT NULL,
                status TEXT DEFAULT 'Unpaid',
                payment_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 2️⃣ Projects Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manager_id INTEGER NOT NULL,
                project_name TEXT NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status TEXT DEFAULT 'In Progress',
                progress INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )
        `);

        // 3️⃣ Project Allotments
        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                assigned_by INTEGER NOT NULL,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES users(id),
                FOREIGN KEY (assigned_by) REFERENCES users(id)
            )
        `);

        // 4️⃣ Tasks Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);

        // 5️⃣ Task Assignments
        await db.execute(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                status TEXT CHECK(status IN ('pending', 'in-progress', 'completed', 'Pending', 'In Progress', 'Completed')) DEFAULT 'pending',
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        `);

        // 6️⃣ Work Sessions
        await db.execute(`
            CREATE TABLE IF NOT EXISTS work_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                check_in_time DATETIME NOT NULL,
                check_out_time DATETIME,
                session_date DATE NOT NULL,
                total_duration INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 7️⃣ Leave Requests
        await db.execute(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                manager_id INTEGER NOT NULL,
                leave_type TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected', 'pending', 'approved', 'rejected')) DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id),
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )
        `);

        // 8️⃣ Attendance Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date DATE NOT NULL,
                check_in DATETIME NOT NULL,
                check_out DATETIME,
                work_hours REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id),
                UNIQUE(employee_id, date)
            )
        `);

        // 9️⃣ Meetings Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manager_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                meeting_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )
        `);

        // 🔟 Meeting Participants
        await db.execute(`
            CREATE TABLE IF NOT EXISTS meeting_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meeting_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        `);

        // 11️⃣ Bonuses Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS bonuses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                reason TEXT,
                date_given DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        `);

        // 12️⃣ Breaks Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS breaks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                break_start DATETIME NOT NULL,
                break_end DATETIME,
                duration INTEGER DEFAULT 0,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        `);

        // 13️⃣ Notifications Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Turso tables initialized with strict INTEGER IDs.');
    } catch (error) {
        console.error('❌ Error initializing Turso tables:', error);
    }
};

module.exports = {
    db,
    initializeTables
};
