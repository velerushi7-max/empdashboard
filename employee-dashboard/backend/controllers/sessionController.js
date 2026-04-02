const { db } = require('../db');
const { nanoid } = require('nanoid');

const sessionController = {
    // ⏱️ Start Work Session
    startSession: async (req, res) => {
        const user_id = req.user?.id || req.body.user_id;
        if (!user_id) return res.status(400).json({ message: 'User ID is required' });
        
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        
        try {
            const existing = await db.execute({
                sql: "SELECT id FROM work_sessions WHERE user_id = ? AND check_out_time IS NULL",
                args: [user_id]
            });

            if (existing.rows.length > 0) {
                return res.json({ message: 'Session already active', id: existing.rows[0].id });
            }
            
            const result = await db.execute({
                sql: "INSERT INTO work_sessions (user_id, check_in_time, session_date) VALUES (?, ?, ?)",
                args: [user_id, now.toISOString(), date]
            });

            res.status(201).json({ id: Number(result.lastInsertRowid), user_id, check_in_time: now.toISOString() });
        } catch (error) {
            console.error('Start Session Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // ⏱️ Stop Work Session
    stopSession: async (req, res) => {
        const user_id = req.user.id;
        const now = new Date();
        
        try {
            const active = await db.execute({
                sql: "SELECT id, check_in_time FROM work_sessions WHERE user_id = ? AND check_out_time IS NULL",
                args: [user_id]
            });

            if (active.rows.length === 0) {
                return res.status(404).json({ message: 'No active session' });
            }
            
            const row = active.rows[0];
            const start = new Date(row.check_in_time);
            const duration = Math.floor((now - start) / 1000);
            
            await db.execute({
                sql: "UPDATE work_sessions SET check_out_time = ?, total_duration = ? WHERE id = ?",
                args: [now.toISOString(), duration, row.id]
            });

            res.json({ id: row.id, duration });
        } catch (error) {
            console.error('Stop Session Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // ⏱️ Get Current Status (For Frontend Header/Dashboard)
    getStatus: async (req, res) => {
        const user_id = req.user.id;
        try {
            const active = await db.execute({
                sql: "SELECT * FROM work_sessions WHERE user_id = ? AND check_out_time IS NULL",
                args: [user_id]
            });

            const status = {
                work: null,
                break: null,
                meeting: null
            };

            if (active.rows.length > 0) {
                const row = active.rows[0];
                status.work = {
                    id: row.id,
                    status: 'Ongoing',
                    start_time: row.check_in_time,
                    duration: 0
                };
            }

            res.json(status);
        } catch (error) {
            console.error('Get Status Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // ⏱️ Get Recent Logs (For Activity History)
    getRecentLogs: async (req, res) => {
        const user_id = req.user.id;
        try {
            const result = await db.execute({
                sql: "SELECT * FROM work_sessions WHERE user_id = ? ORDER BY check_in_time DESC LIMIT 10",
                args: [user_id]
            });

            const logs = result.rows.map(r => ({
                type: 'Work',
                date: r.session_date,
                status: r.check_out_time ? 'Completed' : 'Ongoing',
                duration: r.total_duration || 0,
                start_time: r.check_in_time,
                end_time: r.check_out_time
            }));

            res.json(logs);
        } catch (error) {
            console.error('Get Logs Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 📊 Get Attendance Metrics for Dashboard
    getAttendance: async (req, res) => {
        const { userId } = req.params; // Using userId from URL or req.user.id
        const target_id = userId && userId !== 'me' ? userId : req.user.id;

        try {
            const pRes = await db.execute({
                sql: "SELECT COUNT(DISTINCT session_date) as daysPresent FROM work_sessions WHERE user_id = ?",
                args: [target_id]
            });
            const dRes = await db.execute({
                sql: "SELECT SUM(total_duration) as totalSeconds FROM work_sessions WHERE user_id = ?",
                args: [target_id]
            });

            const daysPresent = Number(pRes.rows[0].daysPresent) || 0;
            const totalSeconds = Number(dRes.rows[0].totalSeconds) || 0;
            const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
            const avgDaily = daysPresent > 0 ? Math.round((totalHours / daysPresent) * 10) / 10 : 0;
            
            res.json({ daysPresent, totalHours, avgDailyHours: avgDaily });
        } catch (error) {
            console.error('Get Attendance Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 📊 Get Detailed Report for personal performance dashboard
    getReport: async (req, res) => {
        const user_id = req.user.id;
        try {
            // 1. Fetch all work sessions
            const workRes = await db.execute({
                sql: "SELECT id, session_date, check_in_time, check_out_time, total_duration FROM work_sessions WHERE user_id = ? ORDER BY check_in_time DESC",
                args: [user_id]
            });

            // 2. Fetch breaks
            const breakRes = await db.execute({
                sql: "SELECT id, date, break_start, break_end, duration FROM breaks WHERE employee_id = ? ORDER BY break_start DESC",
                args: [user_id]
            });

            // 3. Fetch meetings participation
            const meetingRes = await db.execute({
                sql: `
                    SELECT m.id, m.meeting_date, m.start_time, m.end_time, m.title
                    FROM meetings m
                    JOIN meeting_participants mp ON m.id = mp.meeting_id
                    WHERE mp.employee_id = ?
                    ORDER BY m.meeting_date DESC
                `,
                args: [user_id]
            });

            // Map sessions to activity logs
            const workLogs = workRes.rows.map(r => ({
                id: `work_${r.id}`,
                date: r.session_date,
                activity_type: 'Work',
                start_time: r.check_in_time.replace('T', ' '),
                end_time: r.check_out_time ? r.check_out_time.replace('T', ' ') : null,
                duration: Math.round((r.total_duration || 0) / 60), // to mins
                status: r.check_out_time ? 'Completed' : 'Ongoing'
            }));

            const breakLogs = breakRes.rows.map(r => ({
                id: `break_${r.id}`,
                date: r.date,
                activity_type: 'Break',
                start_time: r.break_start.replace('T', ' '),
                end_time: r.break_end ? r.break_end.replace('T', ' ') : null,
                duration: r.duration || 0, // already in mins
                status: r.break_end ? 'Completed' : 'Ongoing'
            }));

            const meetingLogs = meetingRes.rows.map(r => {
                // Parse "HH:MM" strings
                const [h1, m1] = (r.start_time || "00:00").split(':').map(Number);
                const [h2, m2] = (r.end_time || "00:00").split(':').map(Number);
                const duration = (h2 * 60 + m2) - (h1 * 60 + m1);

                return {
                    id: `meeting_${r.id}`,
                    date: r.meeting_date,
                    activity_type: 'Meeting',
                    start_time: `${r.meeting_date} ${r.start_time}:00`,
                    end_time: `${r.meeting_date} ${r.end_time}:00`,
                    duration: duration > 0 ? duration : 0,
                    status: 'Completed'
                };
            });

            // Combine and sort logs by start_time descending
            const logs = [...workLogs, ...breakLogs, ...meetingLogs].sort((a, b) => 
                new Date(b.start_time) - new Date(a.start_time)
            );

            // Calculate summaries
            const summary = {
                work: workLogs.reduce((acc, log) => acc + log.duration, 0),
                break: breakLogs.reduce((acc, log) => acc + log.duration, 0),
                meeting: meetingLogs.reduce((acc, log) => acc + (log.duration || 0), 0)
            };

            res.json({ logs, summary });
        } catch (error) {
            console.error('Get Report Error:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = sessionController;
