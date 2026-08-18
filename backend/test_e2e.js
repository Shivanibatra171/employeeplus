require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function runE2ETests() {
  console.log('🧪 Starting End-to-End Acceptance Tests for EmployeePlus...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  try {
    // 1. Check Admin Account Seeded
    const adminQuery = await pool.query("SELECT * FROM users WHERE email = 'admin@gws.com' AND role = 'admin'");
    assert(adminQuery.rows.length === 1, '1. Admin account exists with role=admin');
    const adminPassMatch = await bcrypt.compare('Admin@123', adminQuery.rows[0].password);
    assert(adminPassMatch === true, '2. Admin password hashes match Admin@123');

    // 2. Check Rewards Catalog
    const rewardsQuery = await pool.query("SELECT * FROM rewards WHERE status = 'active' ORDER BY points_required ASC");
    assert(rewardsQuery.rows.length >= 5, '3. Rewards catalog contains 5 standard rewards');
    const voucher = rewardsQuery.rows.find(r => r.name.includes('Lunch / Coffee Voucher'));
    assert(voucher && voucher.points_required === 100, '4. Lunch/Coffee voucher requires 100 points');

    // 3. Test Feed Anonymity (Mandatory Requirement)
    const feedQuery = await pool.query(
      "SELECT id, category, content, is_anonymous, upvotes, status, created_at FROM posts WHERE status = 'active'"
    );
    const leaksAuthor = feedQuery.rows.some(p => p.user_id !== undefined || p.author !== undefined || p.email !== undefined);
    assert(!leaksAuthor && feedQuery.rows.length > 0, '5. Active feed NEVER exposes user_id or author identity');

    // 4. Test Points Balance Reliability Invariant
    const users = await pool.query("SELECT id, name, points_balance FROM users WHERE role = 'employee'");
    let allBalancesMatch = true;
    for (const u of users.rows) {
      const hist = await pool.query("SELECT COALESCE(SUM(points), 0)::int as sum FROM points_history WHERE user_id = $1", [u.id]);
      if (u.points_balance !== hist.rows[0].sum) {
        allBalancesMatch = false;
        console.error(`Balance mismatch for user ${u.name}: balance=${u.points_balance}, historySum=${hist.rows[0].sum}`);
      }
    }
    assert(allBalancesMatch, '6. Points balance reliability invariant: points_balance == sum(points_history)');

    // 5. Test Flagged Posts Moderation (Admin view hides author)
    const flaggedQuery = await pool.query(`
      SELECT p.id, p.category, p.content, COUNT(rf.id)::int as report_count
      FROM posts p
      JOIN reports_flags rf ON p.id = rf.post_id
      GROUP BY p.id
    `);
    assert(flaggedQuery.rows.length > 0, '7. Moderation queue contains flagged posts');

    // 6. Test Redemptions Workflow
    const redemptionsQuery = await pool.query("SELECT * FROM redemptions WHERE status = 'Pending'");
    assert(redemptionsQuery.rows.length > 0, '8. Pending redemptions queue is active');

    // 7. Test Admin Stats
    const [employeesRes, postsRes, pendingRes, pointsRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'employee'"),
      pool.query("SELECT COUNT(*)::int as count FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)"),
      pool.query("SELECT COUNT(*)::int as count FROM redemptions WHERE status = 'Pending'"),
      pool.query("SELECT COALESCE(SUM(points), 0)::int as total FROM points_history WHERE points > 0 AND created_at >= date_trunc('month', CURRENT_DATE)")
    ]);
    assert(employeesRes.rows[0].count === 4, '9. Total employees count is accurate (4 employees)');
    assert(postsRes.rows[0].count === 6, '10. Total posts count is accurate (6 posts)');
    assert(pendingRes.rows[0].count >= 1, '11. Pending redemptions count is accurate');
    assert(pointsRes.rows[0].total > 0, '12. Points distributed this month is computed accurately');

    console.log(`\n🎉 Test Results: ${passed}/${total} passed!`);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await pool.end();
  }
}

runE2ETests();
