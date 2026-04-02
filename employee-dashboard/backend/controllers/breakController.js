const { db } = require('../db');
const { differenceInMinutes, parseISO, format } = require('date-fns');

const breakController = {
    // Start break
    startBreak: async (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const break_start = format(now, 'yyyy-MM-dd HH:mm:ss');

        if (!employee_id) {
            return res.status(400).json({ message: 'Please provide employee ID' });
        }

        try {
            // Check if there's already an active break
            const existing = await db.execute({
                sql: 'SELECT * FROM breaks WHERE employee_id = ? AND date = ? AND break_end IS NULL',
                args: [employee_id, date]
            });

            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Already have an active break' });
            }

            await db.execute({
                sql: 'INSERT INTO breaks (employee_id, break_start, date) VALUES (?, ?, ?)',
                args: [employee_id, break_start, date]
            });

            res.status(201).json({ message: 'Break started successfully' });
        } catch (err) {
            console.error('Start Break Error:', err);
            res.status(500).json({ message: 'Error starting break', error: err.message });
        }
    },

    // End break
    endBreak: async (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const break_end = format(now, 'yyyy-MM-dd HH:mm:ss');

        if (!employee_id) {
            return res.status(400).json({ message: 'Please provide employee ID' });
        }

        try {
            // Find today's active break
            const result = await db.execute({
                sql: 'SELECT * FROM breaks WHERE employee_id = ? AND date = ? AND break_end IS NULL',
                args: [employee_id, date]
            });

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'No active break record found for today' });
            }

            const record = result.rows[0];
            // Calculate break duration
            const breakStartTime = parseISO(record.break_start.replace(' ', 'T'));
            const breakEndTime = now;
            const duration = differenceInMinutes(breakEndTime, breakStartTime);

            await db.execute({
                sql: 'UPDATE breaks SET break_end = ?, duration = ? WHERE id = ?',
                args: [break_end, duration, record.id]
            });

            res.json({ message: 'Break ended successfully', duration });
        } catch (err) {
            console.error('End Break Error:', err);
            res.status(500).json({ message: 'Error ending break', error: err.message });
        }
    }
};

module.exports = breakController;
