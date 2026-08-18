import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="ep-navbar">
      <div className="ep-nav-container">
        <div className="ep-brand-section">
          <Link to={user?.role === 'admin' ? '/admin' : '/feed'} className="ep-brand-logo">
            <span className="ep-logo-icon">🏢</span>
            <span className="ep-logo-text">Employee<span className="ep-logo-plus">Plus</span></span>
          </Link>

          <div className="ep-nav-links">
            {user?.role === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className={`ep-nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  📊 Admin Dashboard
                </Link>
                <Link
                  to="/feed"
                  className={`ep-nav-link ${isActive('/feed') ? 'active' : ''}`}
                >
                  📰 View Feed
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/feed"
                  className={`ep-nav-link ${isActive('/feed') ? 'active' : ''}`}
                >
                  📰 Feed
                </Link>
                <Link
                  to="/rewards"
                  className={`ep-nav-link ${isActive('/rewards') ? 'active' : ''}`}
                >
                  🎁 Rewards & Redeem
                </Link>
                <Link
                  to="/points-history"
                  className={`ep-nav-link ${isActive('/points-history') ? 'active' : ''}`}
                >
                  🪙 Points History
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="ep-user-section">
          {user?.role === 'employee' && (
            <div className="ep-points-badge" title="Your current redeemable points">
              <span className="ep-points-icon">🪙</span>
              <span className="ep-points-val">{user?.points_balance || 0}</span>
              <span className="ep-points-label">pts</span>
            </div>
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
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
