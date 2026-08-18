import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import './PointsHistory.css';

function PointsHistory() {
  const [history, setHistory] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/points/history')
      .then((res) => {
        setHistory(res.data.history);
        setCurrentBalance(res.data.currentBalance);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="points-page">
      <Navbar />

      <main className="points-container">
        <div className="points-hero-card">
          <div className="points-hero-left">
            <h1>🪙 Points Activity & Ledger</h1>
            <p>Complete transparent record of every action you took, points earned, and rewards redeemed.</p>
          </div>
          <div className="points-hero-right">
            <span className="balance-tag-title">Verified Balance</span>
            <div className="balance-tag-val">
              <span>🪙</span>
              <strong>{currentBalance}</strong>
              <small>pts</small>
            </div>
          </div>
        </div>

        <div className="points-card">
          <div className="points-card-header">
            <h3>Transaction Ledger ({history.length} events)</h3>
          </div>

          {loading ? (
            <div className="points-loading">Loading points ledger...</div>
          ) : history.length === 0 ? (
            <div className="empty-history">
              <p>No points activity logged yet.</p>
              <span>Share an anonymous suggestion, rate your week, or log in daily to earn points!</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ep-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Activity / Event</th>
                    <th>Points</th>
                    <th>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td className="date-cell">
                        {new Date(row.date).toLocaleDateString()} {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="activity-cell">
                        {row.points >= 0 ? (
                          <span className="activity-badge-earn">✨ {row.activity}</span>
                        ) : (
                          <span className="activity-badge-redeem">🎁 {row.activity}</span>
                        )}
                      </td>
                      <td>
                        <span className={`points-pill ${row.points >= 0 ? 'points-positive' : 'points-negative'}`}>
                          {row.points >= 0 ? `+${row.points}` : row.points} pts
                        </span>
                      </td>
                      <td className="running-bal-cell">
                        <strong>🪙 {row.runningBalance} pts</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PointsHistory;