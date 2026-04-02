const { db } = require('../db');
const notificationController = require('./notificationController');

const projectController = {
    // 📁 Create Project (Manager)
    createProject: async (req, res) => {
        try {
            const { 
                project_name, description, timeline, deadline,
                start_date: root_start, end_date: root_end,
                team_members, assigned_employees, 
                tasks, status, progress, manager_id: body_manager_id
            } = req.body;
            const manager_id = body_manager_id || req.user.id;

            // Handle polymorphic property names for date/time
            const start_date = root_start || timeline?.start_date || new Date().toISOString().split('T')[0];
            let end_date = root_end || timeline?.end_date || deadline;

            // Default end_date to 1 month from start if not provided
            if (!end_date || end_date === '') {
                const date = new Date(start_date);
                date.setMonth(date.getMonth() + 1);
                end_date = date.toISOString().split('T')[0];
            }
            
            // Handle polymorphic team list
            const activeTeam = team_members || assigned_employees || [];

            if (!project_name) {
                return res.status(400).json({ 
                    message: 'Missing required project details (project_name)' 
                });
            }

            // 1. Create Project
            const projectResult = await db.execute({
                sql: `INSERT INTO projects (manager_id, project_name, description, start_date, end_date, status, progress) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [manager_id, project_name, description, start_date, end_date, status || 'In Progress', progress || 0]
            });

            const project_id = Number(projectResult.lastInsertRowid);

            // 2. Allot Team Members (Project-level)
            // Ensure we handle both team_members and assigned_employees from tasks
            const taskUsers = (tasks || []).map(t => t.assigned_to).filter(id => id);
            const unifiedTeam = Array.from(new Set([...activeTeam, ...taskUsers]));

            if (unifiedTeam && unifiedTeam.length > 0) {
                for (const emp_id of unifiedTeam) {
                    // Check for existing assignment to prevent duplicates
                    const check = await db.execute({
                        sql: "SELECT 1 FROM project_assignments WHERE project_id = ? AND employee_id = ?",
                        args: [project_id, emp_id]
                    });

                    if (check.rows.length === 0) {
                        await db.execute({
                            sql: "INSERT INTO project_assignments (project_id, employee_id, assigned_by) VALUES (?, ?, ?)",
                            args: [project_id, emp_id, manager_id]
                        });

                        // 🔔 Notify employee of project assignment
                        await notificationController.create(
                            emp_id,
                            'Project',
                            'New Project Assignment',
                            `You have been assigned to project: "${project_name}".`,
                            req.io
                        );
                    }
                }
            }

            // 3. Create Initial Tasks (Optional)
            if (tasks && tasks.length > 0) {
                for (const task of tasks) {
                    const task_title = task.task_title || task.title;
                    if (task_title) {
                        const taskResult = await db.execute({
                            sql: "INSERT INTO tasks (project_id, title, description) VALUES (?, ?, ?)",
                            args: [project_id, task_title, task.description || '']
                        });
                        const task_id = Number(taskResult.lastInsertRowid);

                        if (task.assigned_to) {
                            await db.execute({
                                sql: "INSERT INTO task_assignments (task_id, employee_id, status) VALUES (?, ?, ?)",
                                args: [task_id, task.assigned_to, task.status || 'pending']
                            });

                            // 🔔 Notify employee of task assignment
                            await notificationController.create(
                                task.assigned_to,
                                'Task',
                                'New Task Assignment',
                                `You have been assigned task: "${task_title}" in project: "${project_name}".`,
                                req.io
                            );
                        }
                    }
                }
            }

            res.status(201).json({ id: project_id, message: 'Project created successfully' });
        } catch (error) {
            console.error('Create Project Error:', error);
            res.status(500).json({ message: 'Failed to create project' });
        }
    },

    // 📁 Get Projects Created by Manager
    getManagerProjects: async (req, res) => {
        try {
            const manager_id = req.user.id;
            const result = await db.execute({
                sql: "SELECT * FROM projects WHERE manager_id = ? ORDER BY created_at DESC",
                args: [manager_id]
            });

            // Fetch tasks for each project
            const projectsWithTasks = [];
            for (const project of result.rows) {
                const tasksRes = await db.execute({
                    sql: `SELECT t.*, 
                                 (SELECT GROUP_CONCAT(u.name, ', ') 
                                  FROM task_assignments ta 
                                  JOIN users u ON ta.employee_id = u.id 
                                  WHERE ta.task_id = t.id) as assigned_employees,
                                 (SELECT GROUP_CONCAT(ta.status, ', ')
                                  FROM task_assignments ta
                                  WHERE ta.task_id = t.id) as statuses
                          FROM tasks t 
                          WHERE t.project_id = ?`,
                    args: [project.id]
                });
                projectsWithTasks.push({ ...project, tasks: tasksRes.rows });
            }

            res.json(projectsWithTasks);
        } catch (error) {
            console.error('Get Manager Projects Error:', error);
            res.status(500).json({ message: 'Error fetching projects' });
        }
    },

    createTask: async (req, res) => {
        try {
            const { project_id, title, description, employee_ids } = req.body;
            const manager_id = req.user.id;

            if (!project_id || !title || !employee_ids || employee_ids.length === 0) {
                return res.status(400).json({ message: 'Missing task details or employees' });
            }

            // 1. Insert Task
            const taskResult = await db.execute({
                sql: "INSERT INTO tasks (project_id, title, description) VALUES (?, ?, ?)",
                args: [project_id, title, description]
            });

            const task_id = Number(taskResult.lastInsertRowid);

            // 2. Assign to multiple employees & Sync Project Allotment
            for (const emp_id of employee_ids) {
                // a. Task assignment
                await db.execute({
                    sql: "INSERT INTO task_assignments (task_id, employee_id, status) VALUES (?, ?, 'pending')",
                    args: [task_id, emp_id]
                });

                // b. Ensure they are assigned to the project itself
                const check = await db.execute({
                    sql: "SELECT 1 FROM project_assignments WHERE project_id = ? AND employee_id = ?",
                    args: [project_id, emp_id]
                });

                if (check.rows.length === 0) {
                    await db.execute({
                        sql: "INSERT INTO project_assignments (project_id, employee_id, assigned_by) VALUES (?, ?, ?)",
                        args: [project_id, emp_id, manager_id]
                    });
                }

                // 🔔 Notify employee of task assignment
                const projectRes = await db.execute({
                    sql: "SELECT project_name FROM projects WHERE id = ?",
                    args: [project_id]
                });
                const projectName = projectRes.rows[0]?.project_name || 'a project';
                
                await notificationController.create(
                    emp_id,
                    'Task',
                    'New Task Assignment',
                    `You have been assigned task: "${title}" in project: "${projectName}".`,
                    req.io
                );
            }

            res.status(201).json({ id: task_id, message: 'Task assigned and project team synced successfully' });
        } catch (error) {
            console.error('Create Task Error:', error);
            res.status(500).json({ message: 'Error creating task' });
        }
    },

    getEmployeeProjects: async (req, res) => {
        try {
            const employee_id = req.user.id;
            const result = await db.execute({
                sql: `SELECT 
                        p.id AS project_id,
                        p.project_name,
                        p.description AS project_description,
                        p.start_date,
                        p.end_date,
                        t.id AS task_id,
                        t.title AS task_title,
                        ta.status AS task_status,
                        ta.id AS assignment_id
                      FROM projects p
                      JOIN project_assignments pa ON p.id = pa.project_id
                      LEFT JOIN tasks t ON (p.id = t.project_id AND EXISTS (SELECT 1 FROM task_assignments ta2 WHERE ta2.task_id = t.id AND ta2.employee_id = pa.employee_id))
                      LEFT JOIN task_assignments ta ON (t.id = ta.task_id AND ta.employee_id = pa.employee_id)
                      WHERE pa.employee_id = ?
                      GROUP BY p.id, t.id
                      ORDER BY p.id DESC`,
                args: [employee_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('Get Employee Sync Error:', error);
            res.status(500).json({ message: 'Error fetching unified project data' });
        }
    },

    // 📋 Get Tasks Assigned to Employee (Granular)
    getEmployeeTasks: async (req, res) => {
        try {
            const employee_id = req.user.id;
            const result = await db.execute({
                sql: `SELECT t.*, p.project_name, ta.status, ta.id as assignment_id, p.description as project_description
                      FROM task_assignments ta
                      JOIN tasks t ON ta.task_id = t.id
                      JOIN projects p ON t.project_id = p.id
                      WHERE ta.employee_id = ?
                      ORDER BY t.created_at DESC`,
                args: [employee_id]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('Get Employee Tasks Error:', error);
            res.status(500).json({ message: 'Error fetching assigned tasks' });
        }
    },

    // 📋 Update Task Status (Employee)
    updateTaskStatus: async (req, res) => {
        try {
            const { id } = req.params; // assignment_id
            const { status } = req.body;
            const employee_id = req.user.id;

            await db.execute({
                sql: "UPDATE task_assignments SET status = ? WHERE id = ? AND employee_id = ?",
                args: [status, id, employee_id]
            });

            res.json({ message: 'Task status updated' });
        } catch (error) {
            console.error('Update Task Status Error:', error);
            res.status(500).json({ message: 'Error updating task' });
        }
    },

    // 📋 Get Single Project Details (Manager)
    getProjectById: async (req, res) => {
        try {
            const { id } = req.params;
            const manager_id = req.user.id;
            const result = await db.execute({
                sql: "SELECT * FROM projects WHERE id = ? AND manager_id = ?",
                args: [id, manager_id]
            });
            if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });
            res.json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ message: "Error fetching project" });
        }
    },

    // 📋 Update Project Details (Manager)
    updateProject: async (req, res) => {
        try {
            const { id } = req.params;
            const manager_id = req.user.id;
            const { project_name, description, start_date, end_date, status, progress } = req.body;

            await db.execute({
                sql: `UPDATE projects 
                      SET project_name = ?, description = ?, start_date = ?, end_date = ?, status = ?, progress = ?
                      WHERE id = ? AND manager_id = ?`,
                args: [project_name, description, start_date, end_date, status, progress, id, manager_id]
            });

            res.json({ message: 'Project updated successfully' });
        } catch (error) {
            console.error('Update Project Error:', error);
            res.status(500).json({ message: 'Error updating project' });
        }
    },

    deleteProject: async (req, res) => {
        try {
            const projectId = Number(req.params.id);
            const userId = req.user.id;
            const userRole = req.user.role.toLowerCase();

            console.log(`Attempting to delete project with ID: ${projectId} for user: ${userId} (${userRole})`);

            // 1. Delete associated task assignments and tasks (Explicit if ON DELETE CASCADE failed)
            await db.execute({
                sql: "DELETE FROM task_assignments WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)",
                args: [projectId]
            });
            await db.execute({
                sql: "DELETE FROM tasks WHERE project_id = ?",
                args: [projectId]
            });

            // 2. Delete project team allotments
            await db.execute({
                sql: "DELETE FROM project_assignments WHERE project_id = ?",
                args: [projectId]
            });

            // 3. Delete the project itself (Admin can delete any project, Manager only their own)
            const sql = userRole === 'admin' 
                ? "DELETE FROM projects WHERE id = ?" 
                : "DELETE FROM projects WHERE id = ? AND manager_id = ?";
            const args = userRole === 'admin' ? [projectId] : [projectId, userId];

            const result = await db.execute({ sql, args });

            if (result.rowsAffected === 0) {
                return res.status(404).json({ message: "Project not found or unauthorized" });
            }

            res.json({ message: 'Project and all related data deleted successfully' });
        } catch (error) {
            console.error('Cascading Delete Project Error:', error);
            res.status(500).json({ message: 'Error deleting project' });
        }
    },

    // 📋 Delete Individual Task (Manager)
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute({
                sql: "DELETE FROM tasks WHERE id = ?",
                args: [id]
            });
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: "Error deleting task" });
        }
    },

    getEmployeeProjectsById: async (req, res) => {
        try {
            const employeeId = req.params.employeeId; // ID might be string in Turso/Nanoid
            const result = await db.execute({
                sql: `
                    SELECT 
                        p.id AS project_id,
                        p.project_name,
                        p.description,
                        p.start_date,
                        p.end_date,
                        t.id AS task_id,
                        t.title AS task_title,
                        ta.status,
                        ta.id AS assignment_id
                    FROM projects p
                    JOIN project_assignments pa ON p.id = pa.project_id
                    LEFT JOIN tasks t ON (p.id = t.project_id AND EXISTS (SELECT 1 FROM task_assignments ta2 WHERE ta2.task_id = t.id AND ta2.employee_id = pa.employee_id))
                    LEFT JOIN task_assignments ta ON (t.id = ta.task_id AND ta.employee_id = pa.employee_id)
                    WHERE pa.employee_id = ?
                    GROUP BY p.id, t.id
                    ORDER BY p.id DESC
                `,
                args: [employeeId]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('Explicit Project Fetch Error:', error);
            res.status(500).json({ message: "Error fetching data" });
        }
    }
};

module.exports = projectController;
