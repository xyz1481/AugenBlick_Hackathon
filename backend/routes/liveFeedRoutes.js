const express = require('express');
const router = express.Router();
const { getLiveFeed } = require('../controllers/liveFeedController');

router.get('/feed', getLiveFeed);

module.exports = router;
