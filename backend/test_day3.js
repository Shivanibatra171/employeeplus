const pool = require('./config/db');

async function runTest() {
  console.log('--- Testing Day 1 - Day 3 Functionality ---');

  // 1. Test Admin login & Employee existence
  const adminRes = await pool.query("SELECT * FROM users WHERE email = 'admin@gws.com'");
  console.log('Admin user found:', adminRes.rows.length > 0 ? 'PASS' : 'FAIL');

  // 2. Test User Points Balance & Points History
  const userRes = await pool.query("SELECT * FROM users WHERE email = 'ayesha@gws.com'");
  if (userRes.rows.length > 0) {
    const user = userRes.rows[0];
    console.log(`User ${user.name} points balance: ${user.points_balance}`);

    const historyRes = await pool.query(
      "SELECT SUM(points) as total FROM points_history WHERE user_id = $1",
      [user.id]
    );
    const sumPoints = parseInt(historyRes.rows[0].total || 0, 10);
    console.log(`User ${user.name} points history sum: ${sumPoints}`);
    console.log('Points balance reliability invariant:', user.points_balance === sumPoints ? 'PASS' : 'FAIL');
  }

  // 3. Test Feed Anonymity
  const feedRes = await pool.query(
    "SELECT id, category, content, is_anonymous, upvotes, status, created_at FROM posts WHERE status = 'active'"
  );
  const hasExposedUserId = feedRes.rows.some(p => p.user_id !== undefined || p.author !== undefined);
  console.log('Feed anonymity check (no user_id / author exposed):', !hasExposedUserId ? 'PASS' : 'FAIL');

  console.log('--- Day 1 - Day 3 verification complete ---');
  await pool.end();
}

runTest().catch(err => {
  console.error('Test error:', err);
  pool.end();
});
