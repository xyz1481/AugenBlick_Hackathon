const express = require('express');
const router = express.Router();
const systemsController = require('../controllers/systemsController');

router.get('/overview', systemsController.getSystemsOverview);

module.exports = router;

