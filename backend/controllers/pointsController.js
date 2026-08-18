const pool = require('../config/db');

// Get the logged-in user's points history with a running balance
const getPointsHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, activity, points, created_at
       FROM points_history
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    let runningBalance = 0;
    const history = result.rows.map((row) => {
      runningBalance += row.points;
      return {
        id: row.id,
        date: row.created_at,
        activity: row.activity,
        points: row.points,
        runningBalance,
      };
    });

    // Show most recent first
    history.reverse();

    res.json({ success: true, history, currentBalance: runningBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPointsHistory };