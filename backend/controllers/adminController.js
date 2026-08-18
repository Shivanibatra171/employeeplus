const pool = require('../config/db');

// GET ADMIN DASHBOARD STATS
const getStats = async (req, res) => {
  try {
    const [employeesRes, postsRes, pendingRedemptionsRes, flaggedPostsRes, pointsRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'employee'"),
      pool.query("SELECT COUNT(*)::int as count FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)"),
      pool.query("SELECT COUNT(*)::int as count FROM redemptions WHERE status = 'Pending'"),
      pool.query("SELECT COUNT(DISTINCT rf.post_id)::int as count FROM reports_flags rf JOIN posts p ON rf.post_id = p.id WHERE p.status = 'active'"),
      pool.query("SELECT COALESCE(SUM(points), 0)::int as total FROM points_history WHERE points > 0 AND created_at >= date_trunc('month', CURRENT_DATE)")
    ]);

    res.json({
      success: true,
      stats: {
        totalEmployees: employeesRes.rows[0].count,
        totalPostsThisMonth: postsRes.rows[0].count,
        pendingRedemptions: pendingRedemptionsRes.rows[0].count,
        flaggedPosts: flaggedPostsRes.rows[0].count,
        pointsDistributedThisMonth: pointsRes.rows[0].total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET FLAGGED POSTS (Moderation queue — Anonymity strictly preserved)
const getFlaggedPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.category,
        p.content,
        p.is_anonymous,
        p.upvotes,
        p.status,
        p.created_at,
        COUNT(rf.id)::int as report_count,
        json_agg(
          json_build_object(
            'id', rf.id,
            'reason', rf.reason,
            'created_at', rf.created_at
          ) ORDER BY rf.created_at DESC
        ) as reports
      FROM posts p
      JOIN reports_flags rf ON p.id = rf.post_id
      GROUP BY p.id
      ORDER BY report_count DESC, p.created_at DESC
    `);

    res.json({ success: true, flaggedPosts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE POST STATUS (Hide / Remove / Restore)
const updatePostStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'hidden', 'removed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be active, hidden, or removed' });
  }

  try {
    const result = await pool.query(
      'UPDATE posts SET status = $1 WHERE id = $2 RETURNING id, status, category, content',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({
      success: true,
      message: `Post status updated to ${status}`,
      post: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DISMISS REPORTS FOR A POST
const dismissReports = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM reports_flags WHERE post_id = $1', [id]);
    res.json({ success: true, message: 'Reports dismissed for this post' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL REDEMPTIONS (Admin queue)
const getRedemptions = async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT 
      r.id,
      r.user_id,
      u.name as employee_name,
      u.email as employee_email,
      u.employee_id,
      u.department,
      u.organization,
      rw.id as reward_id,
      rw.name as reward_name,
      rw.points_required,
      r.status,
      r.note,
      r.requested_at,
      r.fulfilled_at
    FROM redemptions r
    JOIN users u ON r.user_id = u.id
    JOIN rewards rw ON r.reward_id = rw.id
  `;
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    query += ` WHERE r.status = $${params.length}`;
  }

  query += ' ORDER BY r.requested_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ success: true, redemptions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE REDEMPTION STATUS (Approve / Reject with refund / Fulfill)
const updateRedemption = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['Pending', 'Approved', 'Fulfilled', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get existing redemption details
    const currentRes = await client.query(
      `SELECT r.*, rw.points_required, rw.name as reward_name 
       FROM redemptions r 
       JOIN rewards rw ON r.reward_id = rw.id 
       WHERE r.id = $1 FOR UPDATE`,
      [id]
    );

    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Redemption request not found' });
    }

    const current = currentRes.rows[0];

    // 2. If rejecting and wasn't already rejected, refund points to employee
    if (status === 'Rejected' && current.status !== 'Rejected') {
      await client.query(
        'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
        [current.points_required, current.user_id]
      );

      await client.query(
        'INSERT INTO points_history (user_id, activity, points) VALUES ($1, $2, $3)',
        [current.user_id, `Refund: Rejected ${current.reward_name}`, current.points_required]
      );
    }

    // 3. Set fulfilled_at timestamp if marking Fulfilled
    let fulfilledAt = current.fulfilled_at;
    if (status === 'Fulfilled' && !fulfilledAt) {
      fulfilledAt = new Date();
    }

    const updateRes = await client.query(
      `UPDATE redemptions 
       SET status = $1, note = $2, fulfilled_at = $3 
       WHERE id = $4 
       RETURNING *`,
      [status, note !== undefined ? note : current.note, fulfilledAt, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Redemption marked as ${status}`,
      redemption: updateRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET ALL REWARDS (Admin catalog management)
const getAdminRewards = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rewards ORDER BY id ASC');
    res.json({ success: true, rewards: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE NEW REWARD
const createReward = async (req, res) => {
  const { name, points_required } = req.body;

  if (!name || !points_required || parseInt(points_required, 10) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid name and points are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rewards (name, points_required, status) VALUES ($1, $2, 'active') RETURNING *`,
      [name.trim(), parseInt(points_required, 10)]
    );

    res.status(201).json({ success: true, reward: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE REWARD (Status toggle or points change)
const updateReward = async (req, res) => {
  const { id } = req.params;
  const { name, points_required, status } = req.body;

  try {
    const currentRes = await pool.query('SELECT * FROM rewards WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const current = currentRes.rows[0];
    const newName = name !== undefined ? name.trim() : current.name;
    const newPoints = points_required !== undefined ? parseInt(points_required, 10) : current.points_required;
    const newStatus = status !== undefined ? status : current.status;

    const result = await pool.query(
      'UPDATE rewards SET name = $1, points_required = $2, status = $3 WHERE id = $4 RETURNING *',
      [newName, newPoints, newStatus, id]
    );

    res.json({ success: true, reward: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getFlaggedPosts,
  updatePostStatus,
  dismissReports,
  getRedemptions,
  updateRedemption,
  getAdminRewards,
  createReward,
  updateReward
};
