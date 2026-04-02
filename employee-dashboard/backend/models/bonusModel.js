const db = require('../db');

const bonusModel = {
    // Get all bonuses
    getAll: (callback) => {
        const query = 'SELECT b.*, e.name as employee_name FROM bonuses b JOIN employees e ON b.employee_id = e.id ORDER BY b.date_given DESC';
        db.all(query, [], callback);
    },

    // Assign bonus
    assign: (bonus, callback) => {
        const { employee_id, bonus_amount, bonus_reason, date_given } = bonus;
        const query = 'INSERT INTO bonuses (employee_id, bonus_amount, bonus_reason, date_given) VALUES (?, ?, ?, ?)';
        db.run(query, [employee_id, bonus_amount, bonus_reason, date_given], callback);
    },

    // Edit bonus
    update: (id, bonus, callback) => {
        const { employee_id, bonus_amount, bonus_reason, date_given } = bonus;
        const query = 'UPDATE bonuses SET employee_id = ?, bonus_amount = ?, bonus_reason = ?, date_given = ? WHERE id = ?';
        db.run(query, [employee_id, bonus_amount, bonus_reason, date_given, id], callback);
    }
};

module.exports = bonusModel;
