const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');

router.post('/analyze-event', intelligenceController.analyzeEvent);

module.exports = router;
