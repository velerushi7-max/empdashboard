const { db } = require('../db');
const { nanoid } = require('nanoid');
const notificationController = require('./notificationController');

const leaveController = {
    // 📝 Employee applies for leave
    applyLeave: async (req, res) => {
        const { leave_type, start_date, end_date, reason } = req.body;
        const employee_id = req.user.id;

        try {
            // 1. Fetch employee's assigned manager_id
            const userRes = await db.execute({
                sql: "SELECT manager_id FROM users WHERE id = ?",
                args: [employee_id]
            });

            if (userRes.rows.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            const manager_id = userRes.rows[0].manager_id;
            if (!manager_id) {
                return res.status(400).json({ message: 'No manager assigned. Please contact admin.' });
            }

            // 2. Create leave request
            const result = await db.execute({
                sql: `
                    INSERT INTO leave_requests (employee_id, manager_id, leave_type, start_date, end_date, reason)
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                args: [employee_id, manager_id, leave_type, start_date, end_date, reason]
            });

            const leaveId = Number(result.lastInsertRowid);
            const employeeNameRes = await db.execute({
                sql: "SELECT name FROM users WHERE id = ?",
                args: [employee_id]
            });
            const employeeName = employeeNameRes.rows[0]?.name || 'An employee';

            // 3. Notify manager
            await notificationController.create(
                manager_id, 
                'Leave', 
                'New Leave Request', 
                `${employeeName} has applied for ${leave_type} from ${start_date} to ${end_date}.`,
                req.io
            );

            res.status(201).json({ id: leaveId, message: 'Leave request submitted to your manager' });
        } catch (error) {
            console.error('Apply Leave Error:', error);
            res.status(500).json({ message: 'Error submitting leave request' });
        }
    },

    // 📋 Employee gets their own leave history
    getEmployeeLeaves: async (req, res) => {
        const employee_id = req.user.id;
        try {
            const result = await db.execute({
                sql: "SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC",
                args: [employee_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('Get Employee Leaves Error:', error);
            res.status(500).json({ message: 'Error fetching leave history' });
        }
    },

    // 📋 Manager gets leave requests assigned to them
    getManagerLeaves: async (req, res) => {
        const manager_id = req.user.id;
        try {
            const result = await db.execute({
                sql: `
                    SELECT lr.*, u.name as employee_name, u.department
                    FROM leave_requests lr
                    JOIN users u ON lr.employee_id = u.id
                    WHERE lr.manager_id = ?
                    ORDER BY lr.created_at DESC
                `,
                args: [manager_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('Get Manager Leaves Error:', error);
            res.status(500).json({ message: 'Error fetching team leave requests' });
        }
    },

    // ✅ Manager updates leave status (Approve/Reject)
    updateLeaveStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'
        const manager_id = req.user.id;

        try {
            // Ensure this manager is the one assigned to this request
            const checkRes = await db.execute({
                sql: "SELECT id FROM leave_requests WHERE id = ? AND manager_id = ?",
                args: [id, manager_id]
            });

            if (checkRes.rows.length === 0) {
                return res.status(403).json({ message: 'Unauthorized: You are not assigned to this leave request' });
            }

            await db.execute({
                sql: "UPDATE leave_requests SET status = ? WHERE id = ?",
                args: [status, id]
            });

            // 3. Notify employee
            const leaveRes = await db.execute({
                sql: "SELECT employee_id, leave_type FROM leave_requests WHERE id = ?",
                args: [id]
            });
            if (leaveRes.rows.length > 0) {
                const { employee_id, leave_type } = leaveRes.rows[0];
                await notificationController.create(
                    employee_id,
                    'Leave',
                    `Leave Request ${status}`,
                    `Your request for ${leave_type} has been ${status.toLowerCase()}.`,
                    req.io
                );
            }

            res.json({ message: `Leave request ${status.toLowerCase()} successfully` });
        } catch (error) {
            console.error('Update Leave Status Error:', error);
            res.status(500).json({ message: 'Error updating leave request' });
        }
    }
};

module.exports = leaveController;
