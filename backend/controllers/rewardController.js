const pool = require('../config/db');

// GET all active rewards
const getRewards = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, points_required, status FROM rewards WHERE status = 'active' ORDER BY points_required ASC"
    );
    res.json({ success: true, rewards: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REDEEM a reward
const redeemReward = async (req, res) => {
  const { rewardId } = req.body;
  const userId = req.user.id;

  if (!rewardId) {
    return res.status(400).json({ success: false, message: 'Reward ID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch the reward
    const rewardRes = await client.query(
      "SELECT * FROM rewards WHERE id = $1 AND status = 'active'",
      [rewardId]
    );

    if (rewardRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Reward not found or inactive' });
    }

    const reward = rewardRes.rows[0];

    // 2. Fetch user's current points balance
    const userRes = await client.query(
      'SELECT points_balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userBalance = userRes.rows[0].points_balance;

    // 3. Check sufficient balance
    if (userBalance < reward.points_required) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${reward.points_required} points but have ${userBalance}.`,
      });
    }

    // 4. Deduct points from user
    const updatedUserRes = await client.query(
      'UPDATE users SET points_balance = points_balance - $1 WHERE id = $2 RETURNING points_balance',
      [reward.points_required, userId]
    );

    // 5. Insert negative transaction in points_history
    await client.query(
      'INSERT INTO points_history (user_id, activity, points) VALUES ($1, $2, $3)',
      [userId, `Redeemed: ${reward.name}`, -reward.points_required]
    );

    // 6. Insert redemption request
    const redemptionRes = await client.query(
      `INSERT INTO redemptions (user_id, reward_id, status)
       VALUES ($1, $2, 'Pending')
       RETURNING id, user_id, reward_id, status, requested_at`,
      [userId, rewardId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Successfully requested redemption for ${reward.name}!`,
      redemption: redemptionRes.rows[0],
      newBalance: updatedUserRes.rows[0].points_balance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET current logged-in employee's redemptions
const getMyRedemptions = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.note, r.requested_at, r.fulfilled_at,
              rw.id as reward_id, rw.name as reward_name, rw.points_required
       FROM redemptions r
       JOIN rewards rw ON r.reward_id = rw.id
       WHERE r.user_id = $1
       ORDER BY r.requested_at DESC`,
      [userId]
    );

    res.json({ success: true, redemptions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRewards, redeemReward, getMyRedemptions };
