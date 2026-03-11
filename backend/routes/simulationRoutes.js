const express = require('express');
const router = express.Router();
const { simulateCrisis } = require('../controllers/simulationController');

console.log('[Routes] Simulator routes initialized');
router.post('/simulate', simulateCrisis);

module.exports = router;
