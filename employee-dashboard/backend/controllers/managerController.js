const { db } = require('../db');

const managerController = {
    // Get Team Employees (assigned to manager)
    getTeam: async (req, res) => {
        try {
            const userId = req.user.id;
            const role = req.user.role;
            
            if (role === 'Admin' || role === 'admin') {
                const result = await db.execute("SELECT id, name, name as username, role FROM users ORDER BY name ASC");
                res.json(result.rows);
            } else {
                const result = await db.execute({
                    sql: "SELECT id, name, name as username, role FROM users WHERE manager_id = ? OR id = ? ORDER BY name ASC",
                    args: [userId, userId]
                });
                res.json(result.rows);
            }
        } catch (error) {
            console.error('getTeam error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    // Get Leave Requests from Team
    getTeamLeaves: async (req, res) => {
        try {
            const manager_id = req.user.id;
            const result = await db.execute({
                sql: `
                    SELECT l.*, u.name as employee_name 
                    FROM leave_requests l 
                    JOIN users u ON l.employee_id = u.id 
                    WHERE l.manager_id = ? 
                    ORDER BY l.id DESC
                `,
                args: [manager_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('getTeamLeaves error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    handleLeaveAction: async (req, res) => {
        try {
            const { leaveId, status } = req.body; 
            if (!leaveId || !status) {
                return res.status(400).json({ message: 'Leave ID and status are required' });
            }
            await db.execute({
                sql: `UPDATE leave_requests SET status = ? WHERE id = ?`,
                args: [status, leaveId]
            });
            res.json({ message: `Leave ${status.toLowerCase()} successfully` });
        } catch (error) {
            console.error('handleLeaveAction error:', error);
            res.status(500).json({ message: 'Error updating leave status' });
        }
    },

    getProjects: async (req, res) => {
        try {
            const manager_id = req.user.id;
            const result = await db.execute({
                sql: `SELECT * FROM projects WHERE manager_id = ? ORDER BY id DESC`,
                args: [manager_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('getProjects error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    createProject: async (req, res) => {
        try {
            const { name, description, start_date, end_date } = req.body;
            const manager_id = req.user.id;
            const result = await db.execute({
                sql: `INSERT INTO projects (project_name, description, start_date, end_date, manager_id) VALUES (?, ?, ?, ?, ?)`,
                args: [name, description, start_date, end_date, manager_id]
            });
            res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Project created' });
        } catch (error) {
            console.error('createProject error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    updateProjectProgress: async (req, res) => {
        try {
            const { projectId, progress, status } = req.body;
            await db.execute({
                sql: `UPDATE projects SET progress = ?, status = ? WHERE id = ?`,
                args: [progress, status, projectId]
            });
            res.json({ message: 'Project updated' });
        } catch (error) {
            console.error('updateProjectProgress error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    // TASK ALLOCATION
    assignTask: async (req, res) => {
        try {
            const { user_id, project_id, title, description, deadline, priority } = req.body;
            const result = await db.execute({
                sql: `INSERT INTO tasks (project_id, title, description) VALUES (?, ?, ?)`,
                args: [project_id, title, description]
            });
            const task_id = Number(result.lastInsertRowid);
            
            // Assign to employee
            await db.execute({
                sql: `INSERT INTO task_assignments (task_id, employee_id, status) VALUES (?, ?, 'pending')`,
                args: [task_id, user_id]
            });

            res.status(201).json({ id: task_id, message: 'Task assigned' });
        } catch (error) {
            console.error('assignTask error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    getProjectTasks: async (req, res) => {
        try {
            const { projectId } = req.params;
            const result = await db.execute({
                sql: `
                    SELECT t.*, u.name as assigned_to 
                    FROM tasks t 
                    JOIN task_assignments ta ON t.id = ta.task_id
                    JOIN users u ON ta.employee_id = u.id 
                    WHERE t.project_id = ?
                `,
                args: [projectId]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('getProjectTasks error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    }
};

module.exports = managerController;
