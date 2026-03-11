const express = require('express');
const router = express.Router();
const { analyzeTopic } = require('../controllers/analysisController');

// Route for performing Narrative vs Reality analysis
router.post('/analyze', analyzeTopic);

module.exports = router;
