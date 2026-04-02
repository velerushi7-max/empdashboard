const { db } = require('../db');
const { differenceInHours, parseISO, format } = require('date-fns');

const attendanceController = {
    // Get all attendance
    getAttendance: async (req, res) => {
        try {
            const query = `
                SELECT a.*, u.name as employee_name 
                FROM attendance a 
                JOIN users u ON a.employee_id = u.id 
                ORDER BY a.date DESC
            `;
            const result = await db.execute(query);
            res.json(result.rows);
        } catch (err) {
            console.error('Get Attendance Error:', err);
            res.status(500).json({ message: 'Error retrieving attendance', error: err.message });
        }
    },

    // Check-in
    checkIn: async (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const check_in = format(now, 'yyyy-MM-dd HH:mm:ss');

        if (!employee_id) {
            return res.status(400).json({ message: 'Please provide employee ID' });
        }

        try {
            // Check if already checked in today
            const existing = await db.execute({
                sql: "SELECT * FROM attendance WHERE employee_id = ? AND date = ?",
                args: [employee_id, date]
            });

            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Already checked in today' });
            }

            await db.execute({
                sql: "INSERT INTO attendance (employee_id, check_in, date) VALUES (?, ?, ?)",
                args: [employee_id, check_in, date]
            });

            res.status(201).json({ message: 'Checked in successfully' });
        } catch (err) {
            console.error('Check-in Error:', err);
            res.status(500).json({ message: 'Error checking in', error: err.message });
        }
    },

    // Check-out
    checkOut: async (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const check_out = format(now, 'yyyy-MM-dd HH:mm:ss');

        if (!employee_id) {
            return res.status(400).json({ message: 'Please provide employee ID' });
        }

        try {
            // Find today's check-in
            const result = await db.execute({
                sql: "SELECT * FROM attendance WHERE employee_id = ? AND date = ?",
                args: [employee_id, date]
            });

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'No check-in record found for today' });
            }

            const record = result.rows[0];
            if (record.check_out) {
                return res.status(400).json({ message: 'Already checked out today' });
            }

            // Calculate work hours
            const checkInTime = parseISO(record.check_in.replace(' ', 'T'));
            const checkOutTime = now;
            const hours = differenceInHours(checkOutTime, checkInTime);

            await db.execute({
                sql: "UPDATE attendance SET check_out = ?, work_hours = ? WHERE id = ?",
                args: [check_out, hours, record.id]
            });

            res.json({ message: 'Checked out successfully', hours });
        } catch (err) {
            console.error('Check-out Error:', err);
            res.status(500).json({ message: 'Error checking out', error: err.message });
        }
    }
};

module.exports = attendanceController;
