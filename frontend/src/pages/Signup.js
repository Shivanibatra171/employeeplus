import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    organization: '',
    department: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/signup', form);
      login(res.data.token, res.data.user);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand-header">
          <span className="auth-logo-icon">🏢</span>
          <h2>Employee<span className="auth-brand-plus">Plus</span></h2>
          <p className="auth-subtitle">Create your anonymous employee account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input
              name="name"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Work Email</label>
            <input
              name="email"
              type="email"
              placeholder="e.g. rahul@gws.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Employee ID</label>
            <input
              name="employee_id"
              placeholder="e.g. EMP005"
              value={form.employee_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Organization / Company</label>
            <input
              name="organization"
              placeholder="e.g. GWS Digital Services"
              value={form.organization}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Department</label>
            <input
              name="department"
              placeholder="e.g. Engineering, Design, HR, Sales"
              value={form.department}
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
            {loading ? 'Creating account...' : 'Create Account & Join Feed'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;