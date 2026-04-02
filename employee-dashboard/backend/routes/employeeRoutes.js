const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// GET /api/employees
router.get('/', employeeController.getEmployees);

// POST /api/employees
router.post('/', employeeController.addEmployee);

// PUT /api/employees/:id
router.put('/:id', employeeController.updateEmployee);

// DELETE /api/employees/:id
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
