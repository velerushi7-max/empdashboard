const express = require('express');
const router = express.Router();
const bonusController = require('../controllers/bonusController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// GET /api/bonuses
router.get('/', bonusController.getBonuses);

// POST /api/bonuses
router.post('/', bonusController.assignBonus);

// PUT /api/bonuses/:id
router.put('/:id', bonusController.updateBonus);

module.exports = router;
