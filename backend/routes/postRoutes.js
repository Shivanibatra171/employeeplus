const express = require('express');
const router = express.Router();
const { createPost, getFeed, upvotePost, submitRating, reportPost } = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createPost);
router.get('/', verifyToken, getFeed);
router.post('/:id/upvote', verifyToken, upvotePost);
router.post('/:id/report', verifyToken, reportPost);
router.post('/rating', verifyToken, submitRating);

module.exports = router;