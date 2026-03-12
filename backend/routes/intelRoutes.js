const express = require('express');
const router = express.Router();
const { getIntelReport } = require('../controllers/intelController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/report', requireAuth, getIntelReport);

module.exports = router;
