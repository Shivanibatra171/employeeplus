import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPostsThisMonth: 0,
    pendingRedemptions: 0,
    flaggedPosts: 0,
    pointsDistributedThisMonth: 0,
  });

  const [activeTab, setActiveTab] = useState('redemptions'); // 'redemptions' | 'moderation' | 'rewards'
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionFilter, setRedemptionFilter] = useState('all');
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [catalogRewards, setCatalogRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // New reward form state
  const [newReward, setNewReward] = useState({ name: '', points_required: '' });
  const [creatingReward, setCreatingReward] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, redemptionsRes, flaggedRes, rewardsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/redemptions', { params: { status: redemptionFilter } }),
        API.get('/admin/flagged-posts'),
        API.get('/admin/rewards'),
      ]);

      setStats(statsRes.data.stats);
      setRedemptions(redemptionsRes.data.redemptions);
      setFlaggedPosts(flaggedRes.data.flaggedPosts);
      setCatalogRewards(rewardsRes.data.rewards);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load admin dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redemptionFilter]);

  // Handle redemption status updates
  const handleUpdateRedemption = async (id, status, note = '') => {
    setProcessingAction(true);
    try {
      await API.put(`/admin/redemptions/${id}`, { status, note });
      setMessage({ text: `Redemption request marked as ${status}`, type: 'success' });
      setRejectingItem(null);
      setRejectNote('');
      fetchDashboardData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update redemption', type: 'error' });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle post moderation status
  const handleUpdatePostStatus = async (id, status) => {
    try {
      await API.put(`/admin/posts/${id}/status`, { status });
      setMessage({ text: `Post status set to "${status}"`, type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update post status', type: 'error' });
    }
  };

  // Dismiss reports for a post
  const handleDismissReports = async (id) => {
    try {
      await API.delete(`/admin/posts/${id}/reports`);
      setMessage({ text: 'Flags dismissed for this post', type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to dismiss reports', type: 'error' });
    }
  };

  // Handle creating a new reward in catalog
  const handleCreateReward = async (e) => {
    e.preventDefault();
    if (!newReward.name.trim() || !newReward.points_required) return;

    setCreatingReward(true);
    try {
      await API.post('/admin/rewards', newReward);
      setMessage({ text: `Added reward: "${newReward.name}" to catalog!`, type: 'success' });
      setNewReward({ name: '', points_required: '' });
      fetchDashboardData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create reward', type: 'error' });
    } finally {
      setCreatingReward(false);
    }
  };

  // Toggle reward active/inactive
  const handleToggleRewardStatus = async (reward) => {
    const nextStatus = reward.status === 'active' ? 'inactive' : 'active';
    try {
      await API.put(`/admin/rewards/${reward.id}`, { status: nextStatus });
      setMessage({ text: `Reward is now ${nextStatus}`, type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to toggle reward', type: 'error' });
    }
  };

  return (
    <div className="admin-page">
      <Navbar />

      <main className="admin-container">
        <div className="admin-header-title">
          <div>
            <h1>🛡️ Admin & HR Moderation Center</h1>
            <p>Manage employee rewards redemptions, moderate reported feedback, and oversee system metrics.</p>
          </div>
        </div>

        {message.text && (
          <div className={`ep-alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.type === 'success' ? '✅ ' : '⚠️ '}
            {message.text}
          </div>
        )}

        {/* 5 Metric Summary Cards */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper icon-employees">👥</div>
            <div className="stat-info">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{stats.totalEmployees}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-posts">📝</div>
            <div className="stat-info">
              <span className="stat-label">Posts This Month</span>
              <span className="stat-value">{stats.totalPostsThisMonth}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-pending">🎁</div>
            <div className="stat-info">
              <span className="stat-label">Pending Redemptions</span>
              <span className="stat-value">{stats.pendingRedemptions}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-flagged">🚩</div>
            <div className="stat-info">
              <span className="stat-label">Flagged Posts</span>
              <span className="stat-value">{stats.flaggedPosts}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-points">🪙</div>
            <div className="stat-info">
              <span className="stat-label">Points Distributed</span>
              <span className="stat-value">{stats.pointsDistributedThisMonth} <span className="stat-sub">pts</span></span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'redemptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('redemptions')}
          >
            🎁 Redemptions Requests ({stats.pendingRedemptions} Pending)
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            🚩 Moderation Queue ({flaggedPosts.length} Reported)
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            🛍️ Rewards Catalog ({catalogRewards.length})
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading dashboard...</div>
        ) : activeTab === 'redemptions' ? (
          /* Tab 1: Redemptions Queue */
          <div className="admin-card">
            <div className="card-header-bar">
              <h3>Employee Redemption Requests</h3>
              <div className="filter-group">
                <span>Filter status:</span>
                <select
                  value={redemptionFilter}
                  onChange={(e) => setRedemptionFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Requests</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {redemptions.length === 0 ? (
              <div className="admin-empty">No redemptions found for this filter.</div>
            ) : (
              <div className="table-responsive">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department / Org</th>
                      <th>Reward</th>
                      <th>Points</th>
                      <th>Requested At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.employee_name}</strong>
                          <div className="sub-text">{r.employee_email} ({r.employee_id})</div>
                        </td>
                        <td>
                          <div>{r.department}</div>
                          <div className="sub-text">{r.organization}</div>
                        </td>
                        <td><strong>{r.reward_name}</strong></td>
                        <td>🪙 {r.points_required}</td>
                        <td>{new Date(r.requested_at).toLocaleDateString()} {new Date(r.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={`status-badge status-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                          {r.note && <div className="note-text">Note: {r.note}</div>}
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            {r.status === 'Pending' && (
                              <>
                                <button
                                  className="btn-action btn-approve"
                                  onClick={() => handleUpdateRedemption(r.id, 'Approved', 'Approved by HR')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn-action btn-reject"
                                  onClick={() => {
                                    setRejectingItem(r);
                                    setRejectNote('Points refunded by HR');
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {r.status === 'Approved' && (
                              <button
                                className="btn-action btn-fulfill"
                                onClick={() => handleUpdateRedemption(r.id, 'Fulfilled', 'Voucher / Perk fulfilled')}
                              >
                                Mark Fulfilled
                              </button>
                            )}

                            {r.status === 'Fulfilled' && (
                              <span className="fulfilled-done">✓ Completed</span>
                            )}

                            {r.status === 'Rejected' && (
                              <span className="rejected-done">Refunded</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'moderation' ? (
          /* Tab 2: Moderation Queue */
          <div className="admin-card">
            <div className="card-header-bar">
              <div>
                <h3>Reported Posts Queue</h3>
                <p className="sub-header-desc">
                  🔒 Strict Anonymity Guard: Authors are never revealed. Review reported content and take moderation actions.
                </p>
              </div>
            </div>

            {flaggedPosts.length === 0 ? (
              <div className="admin-empty">🎉 All clean! No posts are currently flagged.</div>
            ) : (
              <div className="flagged-posts-list">
                {flaggedPosts.map((post) => (
                  <div key={post.id} className="flagged-post-card">
                    <div className="flagged-header">
                      <div className="flagged-tags">
                        <span className={`category-tag category-${post.category.toLowerCase()}`}>
                          {post.category}
                        </span>
                        <span className="report-count-badge">
                          🚩 {post.report_count} Report{post.report_count > 1 ? 's' : ''}
                        </span>
                        <span className={`status-badge status-${post.status}`}>
                          Status: {post.status}
                        </span>
                      </div>
                      <span className="post-date">
                        Posted: {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="flagged-content">"{post.content}"</p>

                    <div className="report-reasons-box">
                      <strong>Report Reasons:</strong>
                      <ul>
                        {post.reports?.map((rep) => (
                          <li key={rep.id}>
                            "{rep.reason}" <span className="reason-time">({new Date(rep.created_at).toLocaleDateString()})</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flagged-actions">
                      {post.status === 'active' ? (
                        <>
                          <button
                            className="btn-action btn-hide"
                            onClick={() => handleUpdatePostStatus(post.id, 'hidden')}
                          >
                            👁️ Hide from Feed
                          </button>
                          <button
                            className="btn-action btn-danger-action"
                            onClick={() => handleUpdatePostStatus(post.id, 'removed')}
                          >
                            🗑️ Remove Post
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-action btn-restore"
                          onClick={() => handleUpdatePostStatus(post.id, 'active')}
                        >
                          ♻️ Restore to Feed
                        </button>
                      )}

                      <button
                        className="btn-action btn-dismiss"
                        onClick={() => handleDismissReports(post.id)}
                      >
                        ✓ Dismiss Flags
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tab 3: Rewards Catalog Management */
          <div className="admin-card">
            <div className="card-header-bar">
              <h3>Rewards Catalog Management</h3>
            </div>

            {/* Add New Reward Form */}
            <form className="add-reward-form" onSubmit={handleCreateReward}>
              <h4>Add New Reward to Catalog</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Reward Name (e.g. Amazon Gift Card)"
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Points Required"
                  value={newReward.points_required}
                  onChange={(e) => setNewReward({ ...newReward, points_required: e.target.value })}
                  min="1"
                  required
                />
                <button type="submit" className="btn-primary" disabled={creatingReward}>
                  {creatingReward ? 'Adding...' : '+ Add Reward'}
                </button>
              </div>
            </form>

            <div className="table-responsive" style={{ marginTop: 24 }}>
              <table className="ep-table">
                <thead>
                  <tr>
                    <th>Reward Name</th>
                    <th>Points Required</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogRewards.map((reward) => (
                    <tr key={reward.id}>
                      <td><strong>{reward.name}</strong></td>
                      <td>🪙 {reward.points_required} pts</td>
                      <td>
                        <span className={`status-badge status-${reward.status}`}>
                          {reward.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn-action ${reward.status === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleRewardStatus(reward)}
                        >
                          {reward.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="modal-backdrop" onClick={() => setRejectingItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Redemption Request</h3>
              <button className="modal-close-btn" onClick={() => setRejectingItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Rejecting this request will automatically <strong>refund 🪙 {rejectingItem.points_required} points</strong> back to <strong>{rejectingItem.employee_name}</strong>.
              </p>
              <label className="modal-label">Rejection Reason / Note:</label>
              <textarea
                className="modal-textarea"
                placeholder="Explain why this request is rejected..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setRejectingItem(null)}
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleUpdateRedemption(rejectingItem.id, 'Rejected', rejectNote)}
                disabled={processingAction}
              >
                {processingAction ? 'Processing...' : 'Confirm Rejection & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;