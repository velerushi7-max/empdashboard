const db = require('../db');
const { format } = require('date-fns');

const activityController = {
    // WORK LOGS
    startWork: (req, res) => {
        const user_id = req.user.id;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const startTime = now.toISOString();

        // Check for existing ongoing work
        db.get(`SELECT id FROM work_logs WHERE user_id = ? AND status IN ('Ongoing', 'Paused')`, [user_id], (err, row) => {
            if (row) return res.status(400).json({ message: 'A work session is already active or paused' });

            db.run(`INSERT INTO work_logs (user_id, start_time, date, status) VALUES (?, ?, ?, 'Ongoing')`,
                [user_id, startTime, date],
                function(err) {
                    if (err) return res.status(500).json({ message: 'Error starting work' });
                    activityController.syncAttendance(user_id, date);
                    res.json({ id: this.lastID, start_time: startTime, status: 'Ongoing' });
                }
            );
        });
    },

    pauseWork: (req, res) => {
        const user_id = req.user.id;
        db.get(`SELECT * FROM work_logs WHERE user_id = ? AND status = 'Ongoing'`, [user_id], (err, row) => {
            if (!row) return res.status(404).json({ message: 'No ongoing work session found' });

            const now = new Date();
            const start = new Date(row.start_time);
            const deltaSeconds = Math.floor((now - start) / 1000);
            const totalDuration = (row.duration || 0) + deltaSeconds;

            db.run(`UPDATE work_logs SET status = 'Paused', duration = ?, end_time = ? WHERE id = ?`,
                [totalDuration, now.toISOString(), row.id],
                (err) => {
                    if (err) return res.status(500).json({ message: 'Error pausing work' });
                    res.json({ message: 'Work paused', duration: totalDuration });
                }
            );
        });
    },

    resumeWork: (req, res) => {
        const user_id = req.user.id;
        db.get(`SELECT * FROM work_logs WHERE user_id = ? AND status = 'Paused'`, [user_id], (err, row) => {
            if (!row) return res.status(404).json({ message: 'No paused work session found' });

            const now = new Date().toISOString();
            db.run(`UPDATE work_logs SET status = 'Ongoing', start_time = ? WHERE id = ?`, [now, row.id], (err) => {
                if (err) return res.status(500).json({ message: 'Error resuming work' });
                res.json({ message: 'Work resumed', start_time: now });
            });
        });
    },

    // Sync Attendance Summary for Today
    syncAttendance: (user_id, date) => {
        // Calculate totals for the day
        const workQuery = `SELECT SUM(duration) as total FROM work_logs WHERE user_id = ? AND date = ?`;
        const breakQuery = `SELECT SUM(duration) as total FROM break_logs WHERE user_id = ? AND date = ?`;
        const timeQuery = `SELECT MIN(start_time) as check_in, MAX(end_time) as check_out FROM work_logs WHERE user_id = ? AND date = ?`;

        db.get(workQuery, [user_id, date], (err, wRow) => {
            db.get(breakQuery, [user_id, date], (err, bRow) => {
                db.get(timeQuery, [user_id, date], (err, tRow) => {
                    const workSec = wRow?.total || 0;
                    const breakSec = bRow?.total || 0;
                    const netSec = Math.max(0, workSec - breakSec);
                    const netHours = Math.round((netSec / 3600) * 100) / 100;
                    const breakHours = Math.round((breakSec / 3600) * 100) / 100;
                    
                    // Update main attendance table summary
                    db.get(`SELECT id FROM attendance WHERE user_id = ? AND date = ?`, [user_id, date], (err, row) => {
                        if (row) {
                            db.run(`UPDATE attendance SET check_in = ?, check_out = ?, work_hours = ?, break_hours = ? WHERE id = ?`,
                                [tRow.check_in, tRow.check_out, netHours, breakHours, row.id]);
                        } else {
                            db.run(`INSERT INTO attendance (user_id, check_in, date, work_hours, break_hours) VALUES (?, ?, ?, ?, ?)`,
                                [user_id, tRow.check_in, date, netHours, breakHours]);
                        }
                    });
                });
            });
        });
    },

    stopWork: (req, res) => {
        const user_id = req.user.id;
        db.get(`SELECT * FROM work_logs WHERE user_id = ? AND status IN ('Ongoing', 'Paused')`, [user_id], (err, row) => {
            if (!row) return res.status(404).json({ message: 'No active work session found' });

            const now = new Date();
            let totalDuration = row.duration || 0;
            if (row.status === 'Ongoing') {
                const start = new Date(row.start_time);
                totalDuration += Math.floor((now - start) / 1000);
            }

            db.run(`UPDATE work_logs SET status = 'Completed', duration = ?, end_time = ? WHERE id = ?`,
                [totalDuration, now.toISOString(), row.id],
                (err) => {
                    if (err) return res.status(500).json({ message: 'Error stopping work' });
                    activityController.syncAttendance(user_id, row.date);
                    res.json({ message: 'Work completed', total_duration: totalDuration });
                }
            );
        });
    },

    // BREAK LOGS
    startBreak: (req, res) => {
        const user_id = req.user.id;
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const startTime = now.toISOString();

        db.run(`INSERT INTO break_logs (user_id, start_time, date) VALUES (?, ?, ?)`,
            [user_id, startTime, date],
            function(err) {
                if (err) return res.status(500).json({ message: 'Error starting break' });
                res.json({ id: this.lastID, start_time: startTime });
            }
        );
    },

    stopBreak: (req, res) => {
        const user_id = req.user.id;
        db.get(`SELECT * FROM break_logs WHERE user_id = ? AND end_time IS NULL ORDER BY id DESC LIMIT 1`, [user_id], (err, row) => {
            if (!row) return res.status(404).json({ message: 'No active break found' });

            const now = new Date();
            const start = new Date(row.start_time);
            const duration = Math.floor((now - start) / 1000);

            db.run(`UPDATE break_logs SET end_time = ?, duration = ? WHERE id = ?`,
                [now.toISOString(), duration, row.id],
                (err) => {
                    if (err) return res.status(500).json({ message: 'Error stopping break' });
                    activityController.syncAttendance(user_id, row.date);
                    res.json({ message: 'Break completed', duration });
                }
            );
        });
    },

    // Get current status and active logs
    getStatus: (req, res) => {
        const user_id = req.user.id;
        const statusData = {
            work: null,
            break: null,
            meeting: null
        };

        db.get(`SELECT * FROM work_logs WHERE user_id = ? AND status IN ('Ongoing', 'Paused')`, [user_id], (err, wRow) => {
            statusData.work = wRow || null;
            db.get(`SELECT * FROM break_logs WHERE user_id = ? AND end_time IS NULL`, [user_id], (err, bRow) => {
                statusData.break = bRow || null;
                
                // Get current/ongoing meeting
                const nowStr = new Date().toISOString();
                const nowTime = format(new Date(), 'HH:mm');
                const nowDate = format(new Date(), 'yyyy-MM-dd');

                db.get(`
                    SELECT m.*, ma.status as assignment_status 
                    FROM meetings m 
                    JOIN meeting_assignments ma ON m.id = ma.meeting_id 
                    WHERE ma.user_id = ? 
                    AND m.meeting_date = ? 
                    AND m.start_time <= ? 
                    AND m.end_time >= ?`, 
                    [user_id, nowDate, nowTime, nowTime], (err, mRow) => {
                        statusData.meeting = mRow || null;
                        res.json(statusData);
                });
            });
        });
    },

    getRecentLogs: (req, res) => {
        const user_id = req.user.id;
        const query = `
            SELECT 'Work' as type, date, status, duration, start_time FROM work_logs WHERE user_id = ?
            UNION ALL
            SELECT 'Break' as type, date, 'Completed' as status, duration, start_time FROM break_logs WHERE user_id = ?
            UNION ALL
            SELECT 'Meeting' as type, m.meeting_date as date, ma.status, 0 as duration, m.start_time FROM meetings m 
            JOIN meeting_assignments ma ON m.id = ma.meeting_id WHERE ma.user_id = ?
            ORDER BY start_time DESC LIMIT 10
        `;
        db.all(query, [user_id, user_id, user_id], (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error fetching logs' });
            res.json(rows);
        });
    },

    getPersonalReports: (req, res) => {
        const user_id = req.user.id;
        const responseData = {
            summary: { work: 0, break: 0, meeting: 0 },
            logs: []
        };

        // Get summaries in one go
        const workQuery = `SELECT SUM(duration) as total FROM work_logs WHERE user_id = ?`;
        const breakQuery = `SELECT SUM(duration) as total FROM break_logs WHERE user_id = ?`;
        
        db.get(workQuery, [user_id], (err, wRow) => {
            responseData.summary.work = Math.ceil((wRow?.total || 0) / 60);
            
            db.get(breakQuery, [user_id], (err, bRow) => {
                responseData.summary.break = Math.ceil((bRow?.total || 0) / 60);
                
                // For log detail
                const logQuery = `
                    SELECT id, date, 'Work' as activity_type, start_time, end_time, (duration/60) as duration, status FROM work_logs WHERE user_id = ?
                    UNION ALL
                    SELECT id, date, 'Break' as activity_type, start_time, end_time, (duration/60) as duration, 'Completed' as status FROM break_logs WHERE user_id = ?
                    ORDER BY date DESC, start_time DESC
                `;
                db.all(logQuery, [user_id, user_id], (err, logs) => {
                    responseData.logs = logs || [];
                    res.json(responseData);
                });
            });
        });
    },

    getAttendanceStats: (req, res) => {
        const user_id = req.user.id;
        const now = new Date();
        const currentMonth = format(now, 'yyyy-MM');
        
        // Comprehensive query for daily activity integrating work and breaks
        const dailyDetailQuery = `
            SELECT 
                w.date,
                MIN(w.start_time) as check_in,
                MAX(w.end_time) as check_out,
                SUM(w.duration) as work_seconds,
                (SELECT SUM(duration) FROM break_logs b WHERE b.user_id = w.user_id AND b.date = w.date) as break_seconds,
                (SELECT status FROM leaves l WHERE l.user_id = w.user_id AND w.date BETWEEN l.start_date AND l.end_date AND l.status = 'Approved' LIMIT 1) as leave_status
            FROM work_logs w
            WHERE w.user_id = ? 
            GROUP BY w.date 
            ORDER BY w.date DESC
        `;

        db.all(dailyDetailQuery, [user_id], (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error fetching history' });
            
            const history = rows.map(r => {
                const totalSeconds = (r.work_seconds || 0) - (r.break_seconds || 0);
                return {
                    date: r.date,
                    check_in: r.check_in,
                    check_out: r.check_out,
                    break_seconds: r.break_seconds || 0,
                    leave_status: r.leave_status,
                    total_hours: Math.max(0, Math.round((totalSeconds / 3600) * 100) / 100)
                };
            });

            // Summary from history
            const currentMonthLogs = history.filter(h => h.date.startsWith(currentMonth));
            const daysPresent = currentMonthLogs.length;
            const totalHours = currentMonthLogs.reduce((acc, curr) => acc + curr.total_hours, 0);
            const avgHours = daysPresent > 0 ? Math.round((totalHours / daysPresent) * 10) / 10 : 0;

            res.json({
                summary: {
                    days_present: daysPresent,
                    total_hours: Math.round(totalHours * 10) / 10,
                    avg_hours: avgHours,
                    month: format(now, 'MMMM yyyy')
                },
                history: history
            });
        });
    }
};


module.exports = activityController;
