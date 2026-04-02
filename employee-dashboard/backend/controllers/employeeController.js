const employeeModel = require('../models/employeeModel');

const employeeController = {
    // Get all employees
    getEmployees: (req, res) => {
        employeeModel.getAll((err, rows) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving employees', error: err.message });
            }
            res.json(rows);
        });
    },

    // Add employee
    addEmployee: (req, res) => {
        const { name, email, role, department, salary, joining_date } = req.body;
        
        if (!name || !email || !role || !department || !salary || !joining_date) {
            return res.status(400).json({ message: 'Please provide all employee details' });
        }

        employeeModel.add({ name, email, role, department, salary, joining_date }, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error adding employee', error: err.message });
            }
            res.status(201).json({ message: 'Employee added successfully' });
        });
    },

    // Update employee
    updateEmployee: (req, res) => {
        const { id } = req.params;
        const { name, email, role, department, salary, joining_date } = req.body;

        if (!name || !email || !role || !department || !salary || !joining_date) {
            return res.status(400).json({ message: 'Please provide all employee details' });
        }

        employeeModel.update(id, { name, email, role, department, salary, joining_date }, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating employee', error: err.message });
            }
            res.json({ message: 'Employee updated successfully' });
        });
    },

    // Delete employee
    deleteEmployee: (req, res) => {
        const { id } = req.params;
        employeeModel.delete(id, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting employee', error: err.message });
            }
            res.json({ message: 'Employee deleted successfully' });
        });
    }
};

module.exports = employeeController;
