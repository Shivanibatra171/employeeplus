require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('🌱 Starting database seed for EmployeePlus...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        employee_id VARCHAR(100) UNIQUE NOT NULL,
        organization VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        points_balance INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT true,
        upvotes INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS points_history (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity VARCHAR(255) NOT NULL,
        points INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        points_required INT NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS redemptions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_id INT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Pending',
        note VARCHAR(255),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fulfilled_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports_flags (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        reported_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables verified.');

    // 2. Clear old test data
    await client.query('TRUNCATE reports_flags, redemptions, points_history, posts, rewards, users RESTART IDENTITY CASCADE;');

    // 3. Hash Passwords
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const empPass = await bcrypt.hash('Password@123', 10);

    // 4. Seed Users
    const usersInsert = await client.query(`
      INSERT INTO users (name, email, employee_id, organization, department, password, role, points_balance)
      VALUES 
        ('Admin HR', 'admin@gws.com', 'ADM001', 'GWS Digital Services', 'Human Resources', '${adminPass}', 'admin', 0),
        ('Ayesha Khan', 'ayesha@gws.com', 'EMP001', 'GWS Digital Services', 'Engineering', '${empPass}', 'employee', 185),
        ('Sara Ahmed', 'sara@gws.com', 'EMP002', 'GWS Digital Services', 'Design', '${empPass}', 'employee', 240),
        ('Hamza Ali', 'hamza@gws.com', 'EMP003', 'GWS Digital Services', 'Marketing', '${empPass}', 'employee', 60),
        ('Zainab Tariq', 'zainab@gws.com', 'EMP004', 'GWS Digital Services', 'Finance', '${empPass}', 'employee', 12)
      RETURNING id, name, email, role, points_balance;
    `);
    console.log(`✅ Seeded ${usersInsert.rows.length} users.`);

    // 5. Seed Rewards Catalog
    await client.query(`
      INSERT INTO rewards (name, points_required, status) VALUES
        ('Lunch / Coffee Voucher', 100, 'active'),
        ('Extra Day Off', 150, 'active'),
        ('Rs. 1000 Cash Reward', 200, 'active'),
        ('Free Course Enrollment', 300, 'active'),
        ('Free Logo / Design Service', 500, 'active');
    `);
    console.log('✅ Seeded 5 standard rewards.');

    // 6. Seed Posts
    const postsInsert = await client.query(`
      INSERT INTO posts (user_id, category, content, is_anonymous, upvotes, status, created_at)
      VALUES
        (2, 'Suggestion', 'Can we have flexible working hours on Fridays so team members can finish sprints early and attend family events?', true, 16, 'active', NOW() - INTERVAL '2 days'),
        (3, 'Appreciation', 'Huge shoutout to the UI team for launching the new client portal ahead of schedule! Great teamwork.', true, 8, 'active', NOW() - INTERVAL '1 day'),
        (4, 'Complaint', 'The AC temperature in the 3rd floor open hall is constantly too cold. Can facilities adjust it to 24°C?', true, 4, 'active', NOW() - INTERVAL '6 hours'),
        (2, 'Confession', 'I was really stressed before the project demo yesterday, but everyone supported me and it went amazingly well.', true, 12, 'active', NOW() - INTERVAL '3 hours'),
        (5, 'Suggestion', 'We should organize a monthly tech talk session where different teams share what they are building.', true, 3, 'active', NOW() - INTERVAL '1 hour'),
        (4, 'Complaint', 'Spam post testing moderation filter violation content', true, 0, 'active', NOW() - INTERVAL '30 minutes')
      RETURNING id;
    `);
    console.log(`✅ Seeded ${postsInsert.rows.length} posts.`);

    // 7. Seed Points History
    // Ayesha: Daily Login (+1), Suggestion (+8), 15+ Upvotes (+15), Weekly Rating (+2), Confession (+5), Coffee Voucher redeemed (-100), Starting base points (+254) -> 185
    await client.query(`
      INSERT INTO points_history (user_id, activity, points, created_at)
      VALUES
        (2, 'Daily Login', 1, NOW() - INTERVAL '3 days'),
        (2, 'Suggestion Post', 8, NOW() - INTERVAL '2 days'),
        (2, 'Post #1 reached 15+ upvotes', 15, NOW() - INTERVAL '2 days'),
        (2, 'Confession Post', 5, NOW() - INTERVAL '1 day'),
        (2, 'Weekly Office Rating (5 stars)', 2, NOW() - INTERVAL '1 day'),
        (2, 'Special Recognition Bonus', 254, NOW() - INTERVAL '1 day'),
        (2, 'Redeemed: Lunch / Coffee Voucher', -100, NOW() - INTERVAL '12 hours'),
        
        (3, 'Daily Login', 1, NOW() - INTERVAL '2 days'),
        (3, 'Appreciation Post', 5, NOW() - INTERVAL '1 day'),
        (3, 'Quarterly Contributor Reward', 234, NOW() - INTERVAL '1 day'),
        
        (4, 'Daily Login', 1, NOW() - INTERVAL '1 day'),
        (4, 'Complaint Post', 5, NOW() - INTERVAL '6 hours'),
        (4, 'Team Hackathon Participation', 54, NOW() - INTERVAL '4 hours'),
        
        (5, 'Daily Login', 1, NOW() - INTERVAL '1 day'),
        (5, 'Suggestion Post', 8, NOW() - INTERVAL '1 hour'),
        (5, 'Weekly Office Rating (4 stars)', 2, NOW() - INTERVAL '1 hour'),
        (5, 'Daily Login', 1, NOW());
    `);
    console.log('✅ Seeded points history.');

    // 8. Seed Redemptions
    await client.query(`
      INSERT INTO redemptions (user_id, reward_id, status, note, requested_at, fulfilled_at)
      VALUES
        (2, 1, 'Pending', NULL, NOW() - INTERVAL '12 hours', NULL),
        (3, 2, 'Approved', 'Approved by HR for next month leave', NOW() - INTERVAL '2 days', NULL),
        (3, 3, 'Fulfilled', 'Transferred to bank account', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days');
    `);
    console.log('✅ Seeded sample redemptions.');

    // 9. Seed Reports / Flags for Moderation
    const spamPostId = postsInsert.rows[5].id;
    await client.query(`
      INSERT INTO reports_flags (post_id, reported_by, reason, created_at)
      VALUES
        (${spamPostId}, 2, 'Spam / Irrelevant content', NOW() - INTERVAL '20 minutes'),
        (${spamPostId}, 3, 'Inappropriate test content', NOW() - INTERVAL '15 minutes');
    `);
    console.log('✅ Seeded sample reports flags.');

    await client.query('COMMIT');
    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
