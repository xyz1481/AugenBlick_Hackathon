const express = require('express');
const router = express.Router();
const { createPost, getPosts, seedPosts } = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, createPost);
router.get('/', getPosts);
router.post('/seed', requireAuth, seedPosts);

module.exports = router;
