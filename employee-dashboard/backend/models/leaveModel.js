const db = require('../db');

const leaveModel = {
    // Get all leave requests
    getAll: (callback) => {
        const query = 'SELECT l.*, e.name as employee_name FROM leaves l JOIN employees e ON l.employee_id = e.id ORDER BY l.start_date DESC';
        db.all(query, [], callback);
    },

    // Apply for leave
    apply: (leave, callback) => {
        const { employee_id, leave_type, start_date, end_date, reason } = leave;
        const query = 'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)';
        db.run(query, [employee_id, leave_type, start_date, end_date, reason], callback);
    },

    // Approve/Reject leave
    updateStatus: (id, status, callback) => {
        const query = 'UPDATE leaves SET status = ? WHERE id = ?';
        db.run(query, [status, id], callback);
    }
};

module.exports = leaveModel;
