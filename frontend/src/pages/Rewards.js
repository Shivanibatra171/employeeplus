import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import './Rewards.css';

function Rewards() {
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [myRedemptions, setMyRedemptions] = useState([]);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my-redemptions'
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [confirmReward, setConfirmReward] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        API.get('/rewards'),
        API.get('/rewards/my-redemptions'),
      ]);
      setRewards(rewardsRes.data.rewards);
      setMyRedemptions(redemptionsRes.data.redemptions);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load rewards data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeemClick = (reward) => {
    setConfirmReward(reward);
    setMessage({ text: '', type: '' });
  };

  const executeRedeem = async () => {
    if (!confirmReward) return;
    setRedeeming(true);
    try {
      const res = await API.post('/rewards/redeem', { rewardId: confirmReward.id });
      setMessage({ text: res.data.message || 'Redemption submitted successfully!', type: 'success' });
      setConfirmReward(null);
      if (refreshUser) refreshUser();
      fetchData();
      setActiveTab('my-redemptions');
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to redeem reward',
        type: 'error',
      });
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Fulfilled':
        return 'status-fulfilled';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="rewards-page">
      <Navbar />

      <main className="rewards-container">
        {/* Banner */}
        <div className="rewards-hero">
          <div className="rewards-hero-content">
            <h1>Organization Rewards Catalog</h1>
            <p>
              Redeem your hard-earned engagement points for exciting perks, cash rewards, and vouchers across the company.
            </p>
          </div>
          <div className="rewards-hero-balance">
            <span className="balance-sub">Available Balance</span>
            <div className="balance-main">
              <span className="balance-number">{user?.points_balance || 0}</span>
              <span className="balance-unit">pts</span>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {message.text && (
          <div className={`ep-alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* Tab switcher */}
        <div className="rewards-tabs">
          <button
            className={`rewards-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Browse Catalog ({rewards.length})
          </button>
          <button
            className={`rewards-tab-btn ${activeTab === 'my-redemptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-redemptions')}
          >
            My Redemptions ({myRedemptions.length})
          </button>
        </div>

        {loading ? (
          <div className="rewards-loading">
            <div className="spinner"></div>
            <span>Loading rewards catalog...</span>
          </div>
        ) : activeTab === 'catalog' ? (
          /* Catalog Grid */
          <div className="rewards-grid">
            {rewards.map((reward) => {
              const currentBalance = user?.points_balance || 0;
              const affordable = currentBalance >= reward.points_required;
              const pointsNeeded = reward.points_required - currentBalance;
              const percent = Math.min(100, Math.round((currentBalance / reward.points_required) * 100));

              return (
                <div key={reward.id} className={`reward-card ${affordable ? 'affordable' : 'locked'}`}>
                  <div className="reward-card-header">
                    <span className="reward-badge-tag">Reward</span>
                    <span className="reward-cost">
                      {reward.points_required} pts
                    </span>
                  </div>

                  <h3 className="reward-title">{reward.name}</h3>

                  <p className="reward-desc">
                    Eligible for all active employees. Quick HR approval and voucher fulfillment.
                  </p>

                  <div className="reward-progress-box">
                    <div className="progress-info">
                      <span className="progress-label">
                        {affordable ? 'Ready to Claim' : `${pointsNeeded} more pts needed`}
                      </span>
                      <span className="progress-pct">{percent}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${affordable ? 'progress-complete' : ''}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="reward-card-footer">
                    {affordable ? (
                      <button
                        className="btn-redeem"
                        onClick={() => handleRedeemClick(reward)}
                      >
                        Claim Reward Now ➔
                      </button>
                    ) : (
                      <button className="btn-locked" disabled>
                        <span>In Progress ({percent}%)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* My Redemptions Table */
          <div className="redemptions-section">
            {myRedemptions.length === 0 ? (
              <div className="empty-state">
                <h3>No Redemptions Yet</h3>
                <p>You haven't requested any rewards yet. Participate in the feed to earn points!</p>
                <button className="btn-browse-catalog" onClick={() => setActiveTab('catalog')}>
                  Browse Rewards Catalog
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>Reward</th>
                      <th>Points Spent</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                      <th>Admin Note / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRedemptions.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold">
                          <span>{item.reward_name}</span>
                        </td>
                        <td className="points-spent-cell">{item.points_required} pts</td>
                        <td className="date-cell">
                          {new Date(item.requested_at).toLocaleDateString()} {new Date(item.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="note-cell">
                          {item.note ? item.note : <span className="text-muted">—</span>}
                          {item.fulfilled_at && (
                            <div className="fulfilled-subtext">
                              Fulfilled on {new Date(item.fulfilled_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmReward && (
        <div className="modal-backdrop" onClick={() => setConfirmReward(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Reward Redemption</h3>
              <button className="modal-close-btn" onClick={() => setConfirmReward(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to redeem <strong>{confirmReward.name}</strong> for{' '}
                <strong>{confirmReward.points_required} points</strong>?
              </p>
              <div className="redeem-summary-box">
                <div className="summary-row">
                  <span>Current Balance:</span>
                  <span>{user?.points_balance || 0} pts</span>
                </div>
                <div className="summary-row">
                  <span>Points to Deduct:</span>
                  <span style={{ color: '#dc2626' }}>- {confirmReward.points_required} pts</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Remaining Balance:</span>
                  <strong>{(user?.points_balance || 0) - confirmReward.points_required} pts</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setConfirmReward(null)}
                disabled={redeeming}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={executeRedeem}
                disabled={redeeming}
              >
                {redeeming ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rewards;
