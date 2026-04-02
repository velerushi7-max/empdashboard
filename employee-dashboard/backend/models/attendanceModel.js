const db = require('../db');

const attendanceModel = {
    // Get all attendance
    getAll: (callback) => {
        db.all('SELECT a.*, e.name as employee_name FROM attendance a JOIN employees e ON a.employee_id = e.id ORDER BY a.date DESC', [], callback);
    },

    // Get attendance by employee_id for today
    getTodayForEmployee: (employee_id, date, callback) => {
        db.get('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date], callback);
    },

    // Check-in
    checkIn: (attendance, callback) => {
        const { employee_id, check_in, date } = attendance;
        const query = 'INSERT INTO attendance (employee_id, check_in, date) VALUES (?, ?, ?)';
        db.run(query, [employee_id, check_in, date], function(err) {
            callback(err, this.lastID);
        });
    },

    // Check-out
    checkOut: (id, check_out, work_hours, callback) => {
        const query = 'UPDATE attendance SET check_out = ?, work_hours = ? WHERE id = ?';
        db.run(query, [check_out, work_hours, id], callback);
    }
};

module.exports = attendanceModel;
