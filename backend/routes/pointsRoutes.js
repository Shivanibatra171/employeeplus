const express = require('express');
const router = express.Router();
const { getPointsHistory } = require('../controllers/pointsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/history', verifyToken, getPointsHistory);

module.exports = router;