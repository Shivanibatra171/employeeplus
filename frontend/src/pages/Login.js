import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Auth.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', form);
      login(res.data.token, res.data.user);

      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      if (err.message === 'Network Error' || !err.response) {
        setError('⚠️ Cannot connect to backend server. Please verify backend is running on http://localhost:5050.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <div className="auth-container">
      {/* Top right theme switcher */}
      <button
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span>{theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
      </button>

      <div className="auth-card">
        <div className="auth-brand-header">
          <div className="auth-logo-icon">🏢</div>
          <h2>Employee<span className="auth-brand-plus">Plus</span></h2>
          <p className="auth-subtitle">Anonymous Feedback & Rewards Portal</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Work Email</label>
            <input
              name="email"
              type="email"
              placeholder="e.g. ayesha@gws.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In ➔'}
          </button>
        </form>

        {/* Demo Credentials Quick Switcher */}
        <div className="demo-credentials-box">
          <span className="demo-title">⚡ Quick 1-Click Demo Login:</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo-pill demo-emp"
              onClick={() => fillDemo('ayesha@gws.com', 'Password@123')}
            >
              👤 Employee (Ayesha)
            </button>
            <button
              type="button"
              className="btn-demo-pill demo-admin"
              onClick={() => fillDemo('admin@gws.com', 'Admin@123')}
            >
              🛡️ Admin / HR
            </button>
          </div>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;