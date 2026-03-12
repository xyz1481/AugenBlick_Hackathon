const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/live', eventController.getLiveEvents);
router.get('/:id/impact-chain', eventController.getEventImpactChain);

module.exports = router;

