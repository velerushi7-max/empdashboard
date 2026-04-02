const { db } = require('../db');
const bcrypt = require('bcryptjs');

const userController = {
    // 👤 Register New User
    register: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Check if user exists
            const existing = await db.execute({
                sql: 'SELECT email FROM users WHERE email = ?',
                args: [email]
            });

            if (existing.rows.length > 0) {
                return res.status(409).json({ message: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await db.execute({
                sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                args: [name, email, hashedPassword, role || 'employee']
            });

            const newId = Number(result.lastInsertRowid);
            res.status(201).json({ message: 'User registered successfully', id: newId });
        } catch (error) {
            console.error('Registration Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 👤 Fetch All Users
    getAllUsers: async (req, res) => {
        try {
            const result = await db.execute('SELECT id, name, email, role, created_at FROM users');
            res.json(result.rows);
        } catch (error) {
            console.error('Get Users Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 👤 Fetch Single User
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.execute({
                sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
                args: [id]
            });

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Get User Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 👤 Update User
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;

            const existing = await db.execute({
                sql: 'SELECT id FROM users WHERE id = ?',
                args: [id]
            });

            if (existing.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            await db.execute({
                sql: 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                args: [name, email, role, id]
            });

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Update User Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 👤 Delete User
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute({
                sql: 'DELETE FROM users WHERE id = ?',
                args: [id]
            });
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete User Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = userController;
