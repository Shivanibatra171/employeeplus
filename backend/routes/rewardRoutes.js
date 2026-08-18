const express = require('express');
const router = express.Router();
const { getRewards, redeemReward, getMyRedemptions } = require('../controllers/rewardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getRewards);
router.post('/redeem', verifyToken, redeemReward);
router.get('/my-redemptions', verifyToken, getMyRedemptions);

module.exports = router;
