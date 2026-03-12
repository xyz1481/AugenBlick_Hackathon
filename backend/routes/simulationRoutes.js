const express = require('express');
const router = express.Router();
const { simulateCrisis, simulateStrike } = require('../controllers/simulationController');

console.log('[Routes] Simulator routes initialized');
router.post('/simulate', simulateCrisis);
router.post('/strike', simulateStrike);

module.exports = router;
