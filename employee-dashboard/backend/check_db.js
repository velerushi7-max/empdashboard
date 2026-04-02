const { db } = require('./db');

async function check() {
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in DB:', tables.rows.map(r => r.name).join(', '));
        
        const usersCount = await db.execute("SELECT COUNT(*) as count FROM users").catch(e => ({ rows: [{count: 'ERROR'}] }));
        console.log('Users count:', usersCount.rows[0].count);
        
        const projectAssignmentsCount = await db.execute("SELECT COUNT(*) as count FROM project_assignments").catch(e => ({ rows: [{count: 'ERROR'}] }));
        console.log('Project Assignments count:', projectAssignmentsCount.rows[0].count);
        
        // Check if 'admins' table exists
        const adminsCount = await db.execute("SELECT COUNT(*) as count FROM admins").catch(e => ({ rows: [{count: 'NONE'}] }));
        console.log('Admins count:', adminsCount.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
