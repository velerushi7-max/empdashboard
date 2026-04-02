const db = require('../db');

const breakModel = {
    // Start break
    start: (breakInfo, callback) => {
        const { employee_id, break_start, date } = breakInfo;
        const query = 'INSERT INTO breaks (employee_id, break_start, date) VALUES (?, ?, ?)';
        db.run(query, [employee_id, break_start, date], function(err) {
            callback(err, this.lastID);
        });
    },

    // End break
    end: (id, break_end, break_duration, callback) => {
        const query = 'UPDATE breaks SET break_end = ?, break_duration = ? WHERE id = ?';
        db.run(query, [break_end, break_duration, id], callback);
    },

    // Get active break for employee
    getActive: (employee_id, date, callback) => {
        db.get('SELECT * FROM breaks WHERE employee_id = ? AND date = ? AND break_end IS NULL', [employee_id, date], callback);
    }
};

module.exports = breakModel;
