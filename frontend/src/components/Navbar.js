import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="ep-navbar">
      <div className="ep-nav-container">
        <div className="ep-brand-section">
          <Link to={user?.role === 'admin' ? '/admin' : '/feed'} className="ep-brand-logo">
            <div className="ep-logo-icon-wrap">
              <span className="ep-logo-icon">🏢</span>
            </div>
            <span className="ep-logo-text">
              Employee<span className="ep-logo-plus">Plus</span>
            </span>
          </Link>

          <nav className="ep-nav-links" aria-label="Main Navigation">
            {user?.role === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className={`ep-nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">📊</span>
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  to="/feed"
                  className={`ep-nav-link ${isActive('/feed') ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">📰</span>
                  <span>View Feed</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/feed"
                  className={`ep-nav-link ${isActive('/feed') ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">📰</span>
                  <span>Feed</span>
                </Link>
                <Link
                  to="/rewards"
                  className={`ep-nav-link ${isActive('/rewards') ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">🎁</span>
                  <span>Rewards</span>
                </Link>
                <Link
                  to="/points-history"
                  className={`ep-nav-link ${isActive('/points-history') ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">🪙</span>
                  <span>Points History</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="ep-user-section">
          {/* Dark / Light Mode Toggle Button */}
          <button
            className="ep-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="theme-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {user?.role === 'employee' && (
            <Link to="/rewards" className="ep-points-badge" title="Click to view & redeem points">
              <span className="ep-points-icon">🪙</span>
              <span className="ep-points-val">{user?.points_balance || 0}</span>
              <span className="ep-points-label">pts</span>
            </Link>
          )}

          <div className="ep-user-pill">
            <div className="ep-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ep-user-info">
              <div className="ep-user-name">{user?.name}</div>
              <div className="ep-user-role">
                <span className={`ep-role-tag ${user?.role === 'admin' ? 'role-admin' : 'role-emp'}`}>
                  {user?.role === 'admin' ? 'HR / Admin' : user?.department || 'Employee'}
                </span>
              </div>
            </div>
          </div>

          <button className="ep-logout-btn" onClick={handleLogout} title="Log out of EmployeePlus">
            <span className="logout-icon">⎋</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
