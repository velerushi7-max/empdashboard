const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// GET /api/leaves
router.get('/', leaveController.getLeaves);

// POST /api/leaves
router.post('/', leaveController.applyLeave);

// PUT /api/leaves/:id
router.put('/:id', leaveController.updateLeaveStatus);

module.exports = router;
