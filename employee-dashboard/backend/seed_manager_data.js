const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database/employee_management.db');
const db = new sqlite3.Database(dbPath);

const seed = async () => {
    // 1. Create a project
    db.run(`INSERT INTO projects (name, description, start_date, end_date, progress, status, manager_id) 
           VALUES ('Mobile App Revamp', 'Redesigning the main customer app.', '2026-03-01', '2026-06-30', 45, 'In Progress', 2)`, function(err) {
        if (err) console.error(err);
        const projectId1 = this.lastID;

        db.run(`INSERT INTO projects (name, description, start_date, end_date, progress, status, manager_id) 
               VALUES ('HR System Integration', 'Integrating legacy data.', '2026-01-15', '2026-04-10', 85, 'Completed', 2)`, function(err) {
            const projectId2 = this.lastID;

            // 2. Assign tasks to employee (ID 3, manager is ID 2)
            const tasks = [
                { user_id: 3, project_id: projectId1, title: 'UI Mockups', status: 'Completed', priority: 'High' },
                { user_id: 3, project_id: projectId1, title: 'API Integration', status: 'In Progress', priority: 'Medium' },
                { user_id: 3, project_id: projectId2, title: 'Data Migration', status: 'Completed', priority: 'High' }
            ];

            tasks.forEach(t => {
                db.run(`INSERT INTO tasks (user_id, project_id, title, status, priority) VALUES (?, ?, ?, ?, ?)`,
                       [t.user_id, t.project_id, t.title, t.status, t.priority]);
            });

            // 3. Add some work logs for productivity data
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

            db.run(`INSERT INTO work_logs (user_id, start_time, end_time, duration, date, status) 
                   VALUES (3, '2026-03-25T09:00:00Z', '2026-03-25T17:00:00Z', 28800, ?, 'Completed')`, [yesterday]);
            db.run(`INSERT INTO work_logs (user_id, start_time, date, status) 
                   VALUES (3, ?, ?, 'Ongoing')`, [new Date().toISOString(), today]);

            console.log('Seed data inserted successfully');
        });
    });
};

seed();
