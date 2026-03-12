const express = require('express');
const router = express.Router();
const conflictController = require('../controllers/conflictController');

router.post('/simulate-conflict', conflictController.simulateConflict);
router.get('/impact-results', conflictController.getImpactResults);
router.get('/trade-dependency', conflictController.getTradeDependency);
router.get('/commodity-risk', conflictController.getCommodityRisk);
router.get('/energy-impact', conflictController.getEnergyImpact);

module.exports = router;
