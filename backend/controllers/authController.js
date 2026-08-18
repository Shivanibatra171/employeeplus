const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// SIGNUP — always creates an 'employee', per the document
const signup = async (req, res) => {
  const { name, email, employee_id, organization, department, password } = req.body;

  if (!name || !email || !employee_id || !organization || !department || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
      [email, employee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or Employee ID already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, employee_id, organization, department, password, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee')
       RETURNING id, name, email, employee_id, organization, department, role, points_balance`,
      [name, email, employee_id, organization, department, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LOGIN — works for both employee and admin
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Award +1 daily login point (Module 2 — only once per day)
    let loginBonusAwarded = false;
    if (user.role === 'employee') {
      const todayLogin = await pool.query(
        `SELECT id FROM points_history 
         WHERE user_id = $1 AND activity = 'Daily Login' 
         AND created_at >= CURRENT_DATE`,
        [user.id]
      );

      if (todayLogin.rows.length === 0) {
        await pool.query(
          `INSERT INTO points_history (user_id, activity, points) VALUES ($1, 'Daily Login', 1)`,
          [user.id]
        );
        await pool.query(
          `UPDATE users SET points_balance = points_balance + 1 WHERE id = $1`,
          [user.id]
        );
        user.points_balance = (user.points_balance || 0) + 1;
        loginBonusAwarded = true;
      }
    }

    delete user.password;

    res.json({ success: true, token, user, loginBonusAwarded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, employee_id, organization, department, role, points_balance FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { signup, login, getMe };