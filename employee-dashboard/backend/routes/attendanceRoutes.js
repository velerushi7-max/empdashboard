const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// GET /api/attendance
router.get('/', attendanceController.getAttendance);

// POST /api/attendance/checkin
router.post('/checkin', attendanceController.checkIn);

// POST /api/attendance/checkout
router.post('/checkout', attendanceController.checkOut);

module.exports = router;
