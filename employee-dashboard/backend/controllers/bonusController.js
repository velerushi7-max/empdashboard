const { db } = require('../db');

const bonusController = {
    // Get all bonuses
    getBonuses: async (req, res) => {
        try {
            const query = `
                SELECT b.*, u.name as employee_name 
                FROM bonuses b 
                JOIN users u ON b.employee_id = u.id 
                ORDER BY b.date_given DESC
            `;
            const result = await db.execute(query);
            // Map table column names to frontend expected property names if necessary
            const rows = result.rows.map(r => ({
                ...r,
                bonus_amount: r.amount,
                bonus_reason: r.reason
            }));
            res.json(rows);
        } catch (err) {
            console.error('Get Bonuses Error:', err);
            res.status(500).json({ message: 'Error retrieving bonuses', error: err.message });
        }
    },

    // Assign bonus
    assignBonus: async (req, res) => {
        const { employee_id, bonus_amount, bonus_reason, date_given } = req.body;
        
        if (!employee_id || !bonus_amount || !bonus_reason || !date_given) {
            return res.status(400).json({ message: 'Please provide all bonus details' });
        }

        try {
            const query = 'INSERT INTO bonuses (employee_id, amount, reason, date_given) VALUES (?, ?, ?, ?)';
            await db.execute({
                sql: query,
                args: [employee_id, bonus_amount, bonus_reason, date_given]
            });
            res.status(201).json({ message: 'Bonus assigned successfully' });
        } catch (err) {
            console.error('Assign Bonus Error:', err);
            res.status(500).json({ message: 'Error assigning bonus', error: err.message });
        }
    },

    // Update bonus
    updateBonus: async (req, res) => {
        const { id } = req.params;
        const { employee_id, bonus_amount, bonus_reason, date_given } = req.body;

        if (!employee_id || !bonus_amount || !bonus_reason || !date_given) {
            return res.status(400).json({ message: 'Please provide all bonus details' });
        }

        try {
            const query = 'UPDATE bonuses SET employee_id = ?, amount = ?, reason = ?, date_given = ? WHERE id = ?';
            await db.execute({
                sql: query,
                args: [employee_id, bonus_amount, bonus_reason, date_given, id]
            });
            res.json({ message: 'Bonus updated successfully' });
        } catch (err) {
            console.error('Update Bonus Error:', err);
            res.status(500).json({ message: 'Error updating bonus', error: err.message });
        }
    }
};

module.exports = bonusController;
