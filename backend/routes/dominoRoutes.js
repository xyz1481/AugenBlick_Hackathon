const express = require('express');
const router = express.Router();
const dominoController = require('../controllers/dominoController');

router.get('/scenarios', dominoController.listScenarios);
router.post('/simulate/:id', dominoController.runScenario);

module.exports = router;

