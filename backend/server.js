require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const pointsRoutes = require('./routes/pointsRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EmployeePlus backend is running' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rewards ORDER BY points_required ASC');
    res.json({ success: true, rewards: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});