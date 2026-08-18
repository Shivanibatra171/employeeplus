const pool = require('../config/db');

// Points awarded per activity (Module 2, wired in now since posts trigger points)
const POST_POINTS = {
  Complaint: 5,
  Confession: 5,
  Suggestion: 8,
  Appreciation: 5,
};

// CREATE POST
const createPost = async (req, res) => {
  const { category, content, is_anonymous } = req.body;
  const userId = req.user.id;

  const validCategories = ['Complaint', 'Confession', 'Suggestion', 'Appreciation'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Content is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const postResult = await client.query(
      `INSERT INTO posts (user_id, category, content, is_anonymous)
       VALUES ($1, $2, $3, $4)
       RETURNING id, category, content, is_anonymous, upvotes, status, created_at`,
      [userId, category, content.trim(), is_anonymous !== false]
    );

    const points = POST_POINTS[category];

    await client.query(
      `INSERT INTO points_history (user_id, activity, points) VALUES ($1, $2, $3)`,
      [userId, `${category} Post`, points]
    );

    await client.query(
      `UPDATE users SET points_balance = points_balance + $1 WHERE id = $2`,
      [points, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, post: postResult.rows[0], pointsEarned: points });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET FEED — never expose user_id, per the Mandatory Requirement
const getFeed = async (req, res) => {
  const { sort = 'newest', category } = req.query;

  let query = `
    SELECT id, category, content, is_anonymous, upvotes, status, created_at
    FROM posts
    WHERE status = 'active'
  `;
  const params = [];

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  query += sort === 'upvoted' ? ' ORDER BY upvotes DESC, created_at DESC' : ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ success: true, posts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPVOTE a post
const upvotePost = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1 AND status = 'active'
       RETURNING id, upvotes`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = result.rows[0];

    // Bonus +15 points to the post's author when it crosses 15 upvotes (Module 2)
    // Only award once — check if this exact bonus was already logged for this post
    if (post.upvotes === 15) {
      const ownerResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
      const ownerId = ownerResult.rows[0].user_id;

      const alreadyAwarded = await pool.query(
        `SELECT id FROM points_history WHERE user_id = $1 AND activity = $2`,
        [ownerId, `Post #${id} reached 15+ upvotes`]
      );

      if (alreadyAwarded.rows.length === 0) {
        await pool.query(
          `INSERT INTO points_history (user_id, activity, points) VALUES ($1, $2, 15)`,
          [ownerId, `Post #${id} reached 15+ upvotes`]
        );
        await pool.query(
          `UPDATE users SET points_balance = points_balance + 15 WHERE id = $1`,
          [ownerId]
        );
      }
    }

    res.json({ success: true, upvotes: post.upvotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// WEEKLY OFFICE RATING
const submitRating = async (req, res) => {
  const { rating } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Store the rating as a special "post" category-less entry in points_history only
    // (per document, this isn't a feed post — it's a private weekly rating)
    await client.query(
      `INSERT INTO points_history (user_id, activity, points) VALUES ($1, $2, 2)`,
      [userId, `Weekly Office Rating (${rating} stars)`]
    );

    await client.query(
      `UPDATE users SET points_balance = points_balance + 2 WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    res.json({ success: true, pointsEarned: 2 });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// REPORT / FLAG A POST (Module 4)
const reportPost = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Report reason is required' });
  }

  try {
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await pool.query(
      `INSERT INTO reports_flags (post_id, reported_by, reason) VALUES ($1, $2, $3)`,
      [id, userId, reason.trim()]
    );

    res.json({ success: true, message: 'Post reported to Admin for review' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPost, getFeed, upvotePost, submitRating, reportPost };