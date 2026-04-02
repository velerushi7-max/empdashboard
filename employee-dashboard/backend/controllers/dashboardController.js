const { db } = require('../db');
const { format } = require('date-fns');

const dashboardController = {
    // Get stats for dashboard
    getStats: async (req, res) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');

            // Execute queries in parallel for better performance
            const [
                totalEmployeesRes,
                employeesPresentRes,
                pendingLeavesRes,
                pendingPayrollRes,
                totalWorkingHoursRes
            ] = await Promise.all([
                db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Employee'"),
                db.execute("SELECT COUNT(*) as count FROM attendance WHERE date = ?", [today]),
                db.execute("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'Pending'"),
                db.execute("SELECT COUNT(*) as count FROM payroll WHERE status = 'Unpaid'"),
                db.execute("SELECT SUM(work_hours) as total FROM attendance WHERE date = ?", [today])
            ]);

            const stats = {
                totalEmployees: Number(totalEmployeesRes.rows[0].count) || 0,
                employeesPresent: Number(employeesPresentRes.rows[0].count) || 0,
                pendingLeaves: Number(pendingLeavesRes.rows[0].count) || 0,
                pendingPayroll: Number(pendingPayrollRes.rows[0].count) || 0,
                totalWorkingHours: Number(totalWorkingHoursRes.rows[0].total) || 0
            };

            res.status(200).json(stats);
        } catch (err) {
            console.error('Dashboard Stats Error:', err);
            res.status(500).json({ 
                message: 'Failed to retrieve dashboard analytics', 
                error: err.message,
                status: 'error'
            });
        }
    }
};

module.exports = dashboardController;
