const express = require('express');
const router = express.Router();
const { getLiveFeed, getLiveInsights, getCurrencyRates } = require('../controllers/liveFeedController');

router.get('/feed', getLiveFeed);
router.get('/insights', getLiveInsights);
router.get('/currency', getCurrencyRates);

module.exports = router;
