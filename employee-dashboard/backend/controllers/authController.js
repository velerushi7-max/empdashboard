const { db } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
require('dotenv').config();

const authController = {
    // 🔐 Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Please provide both email and password' });
            }

            const result = await db.execute({
                sql: 'SELECT * FROM users WHERE email = ?',
                args: [email]
            });

            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

            // ⏱️ Auto-start work session on login (for Employees/Managers)
            if (user.role && user.role.toLowerCase() !== 'admin') {
                const now = new Date();
                try {
                    await db.execute({
                        sql: "INSERT INTO work_sessions (user_id, check_in_time, session_date) VALUES (?, ?, ?)",
                        args: [user.id, now.toISOString(), now.toISOString().split('T')[0]]
                    });
                } catch (e) {
                    console.error('Session auto-start failed (already active?)', e.message);
                }
            }

            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.name, // compatibility
                    role: user.role,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 👤 Get current user
    getMe: async (req, res) => {
        try {
            const result = await db.execute({
                sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
                args: [req.user.id]
            });

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Get Current User Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 🚪 Logout
    logout: async (req, res) => {
        try {
            const user_id = req.user.id;
            const now = new Date();
            
            // Auto-stop active session on logout
            await db.execute({
                sql: "UPDATE work_sessions SET check_out_time = ?, total_duration = ? WHERE user_id = ? AND check_out_time IS NULL",
                args: [now.toISOString(), 0, user_id] // duration update should ideally calculate correctly but here we just end it
            });

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ message: 'Error during logout' });
        }
    }
};

module.exports = authController;
