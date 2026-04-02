const db = require('../db');

const employeeModel = {
    // Get all employees
    getAll: (callback) => {
        db.all('SELECT * FROM employees', [], callback);
    },

    // Get employee by id
    getById: (id, callback) => {
        db.get('SELECT * FROM employees WHERE id = ?', [id], callback);
    },

    // Add employee
    add: (employee, callback) => {
        const { name, email, role, department, salary, joining_date } = employee;
        const query = 'INSERT INTO employees (name, email, role, department, salary, joining_date) VALUES (?, ?, ?, ?, ?, ?)';
        db.run(query, [name, email, role, department, salary, joining_date], callback);
    },

    // Update employee
    update: (id, employee, callback) => {
        const { name, email, role, department, salary, joining_date } = employee;
        const query = 'UPDATE employees SET name = ?, email = ?, role = ?, department = ?, salary = ?, joining_date = ? WHERE id = ?';
        db.run(query, [name, email, role, department, salary, joining_date, id], callback);
    },

    // Delete employee
    delete: (id, callback) => {
        db.run('DELETE FROM employees WHERE id = ?', [id], callback);
    }
};

module.exports = employeeModel;
