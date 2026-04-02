const express = require('express');
const router = express.Router();
const breakController = require('../controllers/breakController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// POST /api/break/start
router.post('/start', breakController.startBreak);

// POST /api/break/end
router.post('/end', breakController.endBreak);

module.exports = router;
