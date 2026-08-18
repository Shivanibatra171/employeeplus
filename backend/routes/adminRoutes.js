const express = require('express');
const router = express.Router();
const {
  getStats,
  getFlaggedPosts,
  updatePostStatus,
  dismissReports,
  getRedemptions,
  updateRedemption,
  getAdminRewards,
  createReward,
  updateReward
} = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes require valid token and admin role
router.use(verifyToken, requireAdmin);

router.get('/stats', getStats);
router.get('/flagged-posts', getFlaggedPosts);
router.put('/posts/:id/status', updatePostStatus);
router.delete('/posts/:id/reports', dismissReports);

router.get('/redemptions', getRedemptions);
router.put('/redemptions/:id', updateRedemption);

router.get('/rewards', getAdminRewards);
router.post('/rewards', createReward);
router.put('/rewards/:id', updateReward);

module.exports = router;
