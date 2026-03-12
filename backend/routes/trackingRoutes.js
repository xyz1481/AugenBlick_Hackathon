const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

router.get('/live', trackingController.getLiveTracking);

module.exports = router;
