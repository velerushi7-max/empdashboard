const { db } = require('./db');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const seedUsers = async () => {
    try {
        console.log('Seed process started...');

        const users = [
            { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
            { name: 'Manager User', email: 'manager@example.com', password: 'manager123', role: 'Manager' },
            { name: 'Employee User', email: 'employee@example.com', password: 'employee123', role: 'Employee' }
        ];

        for (const user of users) {
            // Check if exists
            const existing = await db.execute({
                sql: 'SELECT email FROM users WHERE email = ?',
                args: [user.email]
            });

            if (existing.rows.length === 0) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const id = nanoid();

                await db.execute({
                    sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                    args: [id, user.name, user.email, hashedPassword, user.role]
                });
                console.log(`User created: ${user.name} (${user.role})`);
            } else {
                console.log(`User already exists: ${user.name}`);
            }
        }

        console.log('Seed process completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedUsers();
