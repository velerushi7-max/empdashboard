const { db } = require('../db');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const notificationController = require('./notificationController');

const adminController = {
// ... existing getSummary and getAllUsers ...
// I will just use multi_replace for accuracy if I need more chunks, 
// but for now let's focus on payroll.

    // 📊 DASHBOARD OVERVIEW
    getSummary: async (req, res) => {
        try {
            const [usersCount, managersCount, activeProjects, activeSessions, pendingPayroll, pendingLeaves] = await Promise.all([
                db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Employee'"),
                db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Manager'"),
                db.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'In Progress'"),
                db.execute("SELECT COUNT(*) as count FROM work_sessions WHERE check_out_time IS NULL"),
                db.execute("SELECT COUNT(*) as count FROM payroll WHERE status = 'Unpaid'"),
                db.execute("SELECT COUNT(*) as count FROM leave_requests WHERE status IN ('Pending', 'pending')")
            ]);

            res.json({
                totalEmployees: Number(usersCount.rows[0].count),
                totalManagers: Number(managersCount.rows[0].count),
                activeProjects: Number(activeProjects.rows[0].count),
                activeAttendance: Number(activeSessions.rows[0].count),
                pendingPayroll: Number(pendingPayroll.rows[0].count),
                pendingLeaves: Number(pendingLeaves.rows[0].count)
            });
        } catch (error) {
            console.error('Summary Error:', error);
            res.status(500).json({ message: 'Error fetching summary' });
        }
    },

    // 👤 USER MANAGEMENT
    getAllUsers: async (req, res) => {
        try {
            const result = await db.execute(`
                SELECT u.*, m.name as manager_name 
                FROM users u 
                LEFT JOIN users m ON u.manager_id = m.id
                ORDER BY u.role ASC, u.name ASC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Get Users Error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    createUser: async (req, res) => {
        try {
            const { name, username, email, password, role, manager_id, phone_number, department, joining_date, address, salary, basic_salary } = req.body;
            const defaultPassword = password || 'password123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const displayName = name || username || email.split('@')[0];
            const finalSalary = Number(basic_salary || salary || 0);

            const result = await db.execute({
                sql: `
                    INSERT INTO users (name, email, password, role, manager_id, phone_number, department, joining_date, address, basic_salary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [displayName, email, hashedPassword, role || 'Employee', manager_id || null, phone_number || null, department || null, joining_date || null, address || null, finalSalary]
            });

            const newId = Number(result.lastInsertRowid);

            // 👉 NEW: Automatically create an initial payroll record
            if ((role || 'Employee').toLowerCase() === 'employee') {
                const now = new Date();
                const month = now.toLocaleString('default', { month: 'long' });
                const year = now.getFullYear();
                
                await db.execute({
                    sql: `INSERT INTO payroll (employee_id, basic_salary, bonus, deductions, net_salary, month, year, status) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, 'Unpaid')`,
                    args: [newId, finalSalary, 0, 0, finalSalary, month, year]
                });
            }

            res.status(201).json({ message: 'User created successfully', id: newId });
        } catch (error) {
            console.error('Create User Error:', error);
            res.status(500).json({ message: error.message || 'Server error' });
        }
    },

    // 💰 Payroll Management
    payroll: {
        create: async (req, res) => {
            try {
                const { employee_id, basic_salary, bonus, allowances, deductions, month, year } = req.body;
                const net_salary = (Number(basic_salary) || 0) + (Number(bonus) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0);
                
                // Duplicate Check
                const existing = await db.execute({
                    sql: "SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?",
                    args: [employee_id, month, year]
                });
                if (existing.rows.length > 0) {
                    return res.status(400).json({ message: `Payroll for ${month} ${year} already exists.` });
                }

                const result = await db.execute({
                    sql: `INSERT INTO payroll (employee_id, basic_salary, bonus, allowances, deductions, net_salary, month, year) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [employee_id, basic_salary, bonus || 0, allowances || 0, deductions || 0, net_salary, month, year]
                });

                // 🔔 Notify Employee of new payslip
                await notificationController.create(
                    employee_id,
                    'Payroll',
                    'New Payslip Generated',
                    `Your payslip for ${month} ${year} is now available to view.`,
                    req.io
                );

                res.status(201).json({ id: Number(result.lastInsertRowid) });
            } catch (error) {
                console.error('Payroll Create Error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        getAll: async (req, res) => {
            try {
                const result = await db.execute(`
                    SELECT p.*, u.name as employee_name, u.department, u.role
                    FROM payroll p
                    JOIN users u ON p.employee_id = u.id
                    ORDER BY p.id DESC
                `);
                // Ensure field names match UI expectations
                res.json(result.rows);
            } catch (error) {
                res.status(500).json({ message: 'Server error' });
            }
        },

        // FOR MANAGER DASHBOARD: Fetch team payroll
        getManagerPayroll: async (req, res) => {
            const manager_id = req.user.id;
            try {
                const result = await db.execute({
                    sql: `
                        SELECT p.*, u.name as employee_name, u.department 
                        FROM payroll p
                        JOIN users u ON p.employee_id = u.id
                        WHERE u.manager_id = ?
                        ORDER BY p.id DESC
                    `,
                    args: [manager_id]
                });
                res.json(result.rows);
            } catch (error) {
                console.error('Manager Payroll Error:', error);
                res.status(500).json({ message: 'Error fetching team payroll' });
            }
        },

        update: async (req, res) => {
            try {
                const { id } = req.params;
                const { basic_salary, bonus, allowances, deductions, net_salary, month, year, status } = req.body;
                
                await db.execute({
                    sql: `UPDATE payroll SET basic_salary = ?, bonus = ?, allowances = ?, deductions = ?, net_salary = ?, month = ?, year = ?, status = ? WHERE id = ?`,
                    args: [basic_salary, bonus, allowances, deductions, net_salary, month, year, status, id]
                });
                res.json({ message: 'Payroll updated successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Update failed' });
            }
        },

        updateStatus: async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const paymentDate = status === 'Paid' ? new Date().toISOString() : null;
                
                await db.execute({
                    sql: `UPDATE payroll SET status = ?, payment_date = ? WHERE id = ?`,
                    args: [status, paymentDate, id]
                });

                // 🔔 Notify Employee if payment is confirmed
                if (status === 'Paid') {
                    const payRes = await db.execute({
                        sql: "SELECT employee_id, month, year FROM payroll WHERE id = ?",
                        args: [id]
                    });
                    if (payRes.rows.length > 0) {
                        const { employee_id, month, year } = payRes.rows[0];
                        await notificationController.create(
                            employee_id,
                            'Payroll',
                            'Salary Credited',
                            `Your salary for ${month} ${year} has been marked as paid.`,
                            req.io
                        );
                    }
                }

                res.json({ message: 'Payroll status updated' });
            } catch (error) {
                res.status(500).json({ message: 'Server error' });
            }
        },

        getEmployeePayslips: async (req, res) => {
            try {
                const employeeId = parseInt(req.params.employeeId || req.user.id);
                const result = await db.execute({
                    sql: `
                        SELECT 
                            p.*, 
                            u.name as employee_name, 
                            u.id as employee_id_str, 
                            u.department, 
                            m.name as manager_name
                        FROM payroll p 
                        JOIN users u ON p.employee_id = u.id
                        LEFT JOIN users m ON u.manager_id = m.id
                        WHERE p.employee_id = ? 
                        ORDER BY p.id DESC
                    `,
                    args: [employeeId]
                });
                res.json(result.rows);
            } catch (error) {
                console.error('Fetch Payslips Error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        delete: async (req, res) => {
            try {
                const { id } = req.params;
                await db.execute({ sql: "DELETE FROM payroll WHERE id = ?", args: [id] });
                res.json({ message: 'Payroll record deleted' });
            } catch (error) {
                res.status(500).json({ message: 'Delete failed' });
            }
        }
    },

    updateUser: async (req, res) => {
        const id = req.params.id || req.body.id;
        const { username, name, role, manager_id, email, phone_number, department, status, address, basic_salary, joining_date } = req.body;
        const displayName = name || username;

        try {
            await db.execute({
                sql: `
                    UPDATE users 
                    SET name = ?, role = ?, manager_id = ?, email = ?, phone_number = ?, department = ?, status = ?, address = ?, basic_salary = ?, joining_date = ?
                    WHERE id = ?
                `,
                args: [
                    displayName, 
                    role, 
                    manager_id || null, 
                    email, 
                    phone_number || null, 
                    department || null, 
                    status || 'Active', 
                    address || null, 
                    Number(basic_salary || 0),
                    joining_date || null,
                    id
                ]
            });
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Update User Error:', error);
            res.status(500).json({ message: 'Update failed' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute({
                sql: `DELETE FROM users WHERE id = ?`,
                args: [id]
            });
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete User Error:', error);
            res.status(500).json({ message: 'Deletion failed' });
        }
    },

    // 💰 SALARY MANAGEMENT (Placeholders for migration)
    getSalaries: async (req, res) => {
        try {
            const result = await db.execute("SELECT id, name as username, role FROM users WHERE role != 'Admin'");
            res.json(result.rows.map(r => ({ ...r, base_salary: 0, bonuses: 0, deductions: 0, net_salary: 0 })));
        } catch (error) {
            res.status(500).json({ message: 'Database error' });
        }
    },

    // 📅 ATTENDANCE & LEAVES
    getAllAttendance: async (req, res) => {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        try {
            const result = await db.execute({
                sql: `
                    SELECT ws.*, u.name as employee_name, u.role
                    FROM work_sessions ws
                    JOIN users u ON ws.user_id = u.id
                    WHERE ws.session_date = ?
                    ORDER BY ws.check_in_time DESC
                `,
                args: [targetDate]
            });
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: 'Database error' });
        }
    },

    getAllLeaves: async (req, res) => {
        try {
            const result = await db.execute(`
                SELECT 
                    lr.*, 
                    u.name as employee_name, 
                    u.department 
                FROM leave_requests lr
                JOIN users u ON lr.employee_id = u.id
                ORDER BY lr.id DESC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Admin Fetch Leaves Error:', error);
            res.status(500).json({ message: 'Error fetching organization leaves' });
        }
    },

    getAdminProjects: async (req, res) => {
        try {
            const result = await db.execute(`
                SELECT 
                    p.id AS project_id,
                    p.project_name,
                    p.description,
                    u.name AS employee_name,
                    t.title AS task_title,
                    ta.status
                FROM projects p
                LEFT JOIN project_assignments pa ON p.id = pa.project_id
                LEFT JOIN users u ON pa.employee_id = u.id
                LEFT JOIN tasks t ON t.project_id = p.id
                LEFT JOIN task_assignments ta ON (t.id = ta.task_id AND ta.employee_id = u.id)
                ORDER BY p.id DESC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Admin Fetch Projects Error:', error);
            res.status(500).json({ message: 'Error fetching global projects data' });
        }
    },

    getManagers: async (req, res) => {
        try {
            const result = await db.execute({
                sql: "SELECT id, name FROM users WHERE LOWER(role) = 'manager' ORDER BY name ASC"
            });
            res.json(result.rows);
        } catch (err) {
            console.error('Get Managers Error:', err);
            res.status(500).json({ message: 'Error fetching managers' });
        }
    }
};

module.exports = adminController;
