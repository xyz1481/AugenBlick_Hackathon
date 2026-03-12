const express = require('express');
const router = express.Router();
const stabilityController = require('../controllers/stabilityController');

router.get('/global', stabilityController.getGlobalStability);

module.exports = router;

