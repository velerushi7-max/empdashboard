const { db, initializeTables } = require('./db');

const rebuild = async () => {
    try {
        console.log('--- REBUILDING TURSO TABLES ---');
        
        // 🚨 CRITICAL: Drop existing tables to ensure the new schema is applied
        console.log('Dropping old tables...');
        await db.execute('DROP TABLE IF EXISTS work_sessions');
        await db.execute('DROP TABLE IF EXISTS tasks');
        await db.execute('DROP TABLE IF EXISTS projects');
        await db.execute('DROP TABLE IF EXISTS users');
        
        console.log('Creating fresh tables...');
        await initializeTables();
        
        console.log('--- REBUILD COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Rebuild failed:', error);
        process.exit(1);
    }
};

rebuild();
