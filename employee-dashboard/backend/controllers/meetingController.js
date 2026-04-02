const { db } = require('../db');
const notificationController = require('./notificationController');

const meetingController = {
    // 📅 Create Meeting (Manager only)
    createMeeting: async (req, res) => {
        const { title, description, meeting_date, start_time, end_time, employee_ids } = req.body;
        const manager_id = req.user.id;

        if (!title || !meeting_date || !start_time || !end_time || !employee_ids || employee_ids.length === 0) {
            return res.status(400).json({ message: 'Missing required meeting details' });
        }

        // Validation: Start time must be before end time
        if (start_time >= end_time) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        try {
            // 1. Create meeting
            const result = await db.execute({
                sql: `
                    INSERT INTO meetings (manager_id, title, description, meeting_date, start_time, end_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                args: [manager_id, title, description, meeting_date, start_time, end_time]
            });

            // SQLite's lastInsertRowid can be retrieved from the result if supported, or via query
            const meeting_id = Number(result.lastInsertRowid); // LibSQL supports this

            // 2. Add participants and Notify them
            for (const emp_id of employee_ids) {
                await db.execute({
                    sql: "INSERT INTO meeting_participants (meeting_id, employee_id) VALUES (?, ?)",
                    args: [meeting_id, emp_id]
                });

                // Notify participant
                await notificationController.create(
                    emp_id,
                    'Meeting',
                    'New Meeting Scheduled',
                    `You have been invited to "${title}" on ${meeting_date} at ${start_time}.`,
                    req.io
                );
            }

            res.status(201).json({ id: meeting_id, message: 'Meeting scheduled successfully' });
        } catch (error) {
            console.error('Create Meeting Error:', error);
            res.status(500).json({ message: 'Error scheduling meeting' });
        }
    },

    // 📅 Get Meetings for Manager (Meetings they created)
    getManagerMeetings: async (req, res) => {
        const manager_id = req.user.id;
        try {
            const meetings = await db.execute({
                sql: `
                    SELECT m.*, 
                           (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = m.id) as participants_count
                    FROM meetings m
                    WHERE m.manager_id = ?
                    ORDER BY m.meeting_date DESC, m.start_time DESC
                `,
                args: [manager_id]
            });
            res.json(meetings.rows);
        } catch (error) {
            console.error('Get Manager Meetings Error:', error);
            res.status(500).json({ message: 'Error fetching meetings' });
        }
    },

    // 📅 Get Meetings for Employee (Meetings they are participating in)
    getEmployeeMeetings: async (req, res) => {
        const employee_id = req.user.id;
        try {
            const meetings = await db.execute({
                sql: `
                    SELECT m.*, u.name as manager_name
                    FROM meetings m
                    JOIN meeting_participants mp ON m.id = mp.meeting_id
                    JOIN users u ON m.manager_id = u.id
                    WHERE mp.employee_id = ?
                    ORDER BY m.meeting_date ASC, m.start_time ASC
                `,
                args: [employee_id]
            });
            res.json(meetings.rows);
        } catch (error) {
            console.error('Get Employee Meetings Error:', error);
            res.status(500).json({ message: 'Error fetching assigned meetings' });
        }
    },

    // 📅 Delete Meeting
    deleteMeeting: async (req, res) => {
        const { id } = req.params;
        const manager_id = req.user.id;
        try {
            await db.execute({
                sql: "DELETE FROM meetings WHERE id = ? AND manager_id = ?",
                args: [id, manager_id]
            });
            res.json({ message: 'Meeting cancelled' });
        } catch (error) {
            console.error('Delete Meeting Error:', error);
            res.status(500).json({ message: 'Error cancelling meeting' });
        }
    }
};

module.exports = meetingController;
