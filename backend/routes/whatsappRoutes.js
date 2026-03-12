const express = require('express');
const { sendUpdateToUser, broadcastNewsByCountry } = require('../controllers/whatsappController');
const router = express.Router();

router.post('/notify', sendUpdateToUser);
router.post('/broadcast', broadcastNewsByCountry);

module.exports = router;