import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ReportModal from '../components/ReportModal';
import API from '../api/axios';
import './Feed.css';

const CATEGORIES = [
  { name: 'Suggestion', icon: '💡', pts: 8, hint: 'Idea for improvement' },
  { name: 'Appreciation', icon: '🙌', pts: 5, hint: 'Kudos to someone/team' },
  { name: 'Complaint', icon: '📣', pts: 5, hint: 'Issue or concern' },
  { name: 'Confession', icon: '🤫', pts: 5, hint: 'Honest thought' },
];

function Feed() {
  const { refreshUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [sort, setSort] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('');

  const [category, setCategory] = useState('Suggestion');
  const [content, setContent] = useState('');
  const isAnonymous = true;
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingMsg, setRatingMsg] = useState('');

  // Reporting modal
  const [reportingPostId, setReportingPostId] = useState(null);
  const [toast, setToast] = useState('');

  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const params = { sort };
      if (filterCategory) params.category = filterCategory;
      const res = await API.get('/posts', { params });
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, filterCategory]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    setPostMsg('');
    try {
      const res = await API.post('/posts', {
        category,
        content,
        is_anonymous: isAnonymous,
      });
      setContent('');
      setPostMsg(`🎉 Posted! +${res.data.pointsEarned} points earned.`);
      fetchFeed();
      if (refreshUser) refreshUser();
    } catch (err) {
      setPostMsg(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleUpvote = async (postId) => {
    try {
      await API.post(`/posts/${postId}/upvote`);
      fetchFeed();
      if (refreshUser) refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRating = async (stars) => {
    setRating(stars);
    try {
      const res = await API.post('/posts/rating', { rating: stars });
      setRatingMsg(`✨ Thanks for rating! +${res.data.pointsEarned} points earned.`);
      if (refreshUser) refreshUser();
    } catch (err) {
      setRatingMsg(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const RATING_LABELS = {
    1: '😞 Stressful / Difficult',
    2: '😐 Could be better',
    3: '🙂 Good & Balanced',
    4: '😀 Productive & Great',
    5: '🚀 Fantastic Week!',
  };

  return (
    <div className="feed-page">
      <Navbar />

      <div className="feed-container">
        {toast && <div className="feed-toast">{toast}</div>}

        <div className="feed-layout">
          <div className="feed-main">
            {/* Create Post Card */}
            <form className="create-post-card" onSubmit={handleCreatePost}>
              <div className="card-top-title">
                <div className="title-with-badge">
                  <h3>💬 Share Workplace Feedback</h3>
                  <p className="composer-sub">Safe, candid, and 100% anonymous</p>
                </div>
                <div className="anon-guarantee-badge">
                  <span className="shield-icon">🛡️</span>
                  <span>100% Anonymous</span>
                </div>
              </div>

              <div className="category-selection-row">
                <label className="field-label">Choose Category:</label>
                <div className="category-buttons">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`cat-btn cat-${c.name.toLowerCase()} ${category === c.name ? 'cat-active' : ''}`}
                      onClick={() => setCategory(c.name)}
                    >
                      <span className="cat-icon">{c.icon}</span>
                      <span>{c.name}</span>
                      <span className="cat-pts">+{c.pts} pts</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="textarea-wrapper">
                <textarea
                  placeholder="What's on your mind? Share suggestions, kudos to peers, or constructive feedback anonymously..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="create-post-footer">
                <label className="anon-checkbox-label">
                  <span className="anon-check-icon">🔒</span>
                  <span>Identity hidden from everyone (including HR/Admin)</span>
                </label>

                <button type="submit" className="btn-post-submit" disabled={posting}>
                  {posting ? (
                    <span>Posting...</span>
                  ) : (
                    <span>Publish Anonymously ➔</span>
                  )}
                </button>
              </div>

              {postMsg && <div className="post-success-msg">{postMsg}</div>}
            </form>

            {/* Feed Filters & Sorter */}
            <div className="feed-filters-bar">
              <div className="filter-pill-group">
                <button
                  className={`pill-btn ${filterCategory === '' ? 'pill-active' : ''}`}
                  onClick={() => setFilterCategory('')}
                >
                  All Posts
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.name}
                    className={`pill-btn ${filterCategory === c.name ? 'pill-active' : ''}`}
                    onClick={() => setFilterCategory(c.name)}
                  >
                    <span>{c.icon}</span> {c.name}
                  </button>
                ))}
              </div>

              <div className="sort-box">
                <span className="sort-label">Sort:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-dropdown">
                  <option value="newest">🕒 Newest First</option>
                  <option value="upvoted">🔥 Most Upvoted</option>
                </select>
              </div>
            </div>

            {/* Posts List */}
            {loadingFeed ? (
              <div className="feed-loading">
                <div className="spinner"></div>
                <span>Loading workplace feed...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-feed-card">
                <div className="empty-icon">💬</div>
                <h3>No feedback in this category yet</h3>
                <p>Be the first coworker to share anonymous feedback and earn bonus reward points!</p>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <article key={post.id} className="post-card">
                    <div className="post-card-top">
                      <div className="post-meta-left">
                        <div className="anon-avatar-bubble">
                          <span>🔒</span>
                        </div>
                        <div>
                          <div className="anon-author-title">Anonymous Coworker</div>
                          <span className="post-date">
                            {new Date(post.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <span className={`category-tag category-${post.category.toLowerCase()}`}>
                        {post.category}
                      </span>
                    </div>

                    <p className="post-content">{post.content}</p>

                    <div className="post-card-bottom">
                      <button
                        className={`upvote-btn ${post.upvotes > 0 ? 'has-upvotes' : ''}`}
                        onClick={() => handleUpvote(post.id)}
                        title="Upvote this post"
                      >
                        <span className="upvote-arrow">▲</span>
                        <span className="upvote-count">{post.upvotes}</span>
                        <span className="upvote-label">{post.upvotes === 1 ? 'Upvote' : 'Upvotes'}</span>
                      </button>

                      <button
                        className="report-btn"
                        onClick={() => setReportingPostId(post.id)}
                        title="Report inappropriate post to HR/Admin"
                      >
                        🚩 Report
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Weekly Rating & Info */}
          <aside className="feed-sidebar">
            <div className="sidebar-card rating-card">
              <div className="sidebar-card-header">
                <span className="sidebar-badge-icon">⭐</span>
                <h4>Weekly Pulse Check</h4>
              </div>
              <p className="sidebar-desc">
                How was your work experience this week? Rate to earn <strong>+2 points</strong>!
              </p>

              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn ${(hoverRating || rating) >= n ? 'star-filled' : ''}`}
                    onClick={() => handleRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    title={`Rate ${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="star-mood-text">
                {(hoverRating || rating) ? RATING_LABELS[hoverRating || rating] : 'Tap a star to rate'}
              </div>

              {ratingMsg && <div className="rating-feedback">{ratingMsg}</div>}
            </div>

            <div className="sidebar-card points-rules-card">
              <div className="sidebar-card-header">
                <span className="sidebar-badge-icon">🪙</span>
                <h4>How to Earn Points</h4>
              </div>
              <ul className="points-rules-list">
                <li>
                  <span className="rule-name">💡 Suggestion Post</span>
                  <span className="rule-pts">+8 pts</span>
                </li>
                <li>
                  <span className="rule-name">💬 Appreciation / Other Post</span>
                  <span className="rule-pts">+5 pts</span>
                </li>
                <li>
                  <span className="rule-name">🔥 Post Reaches 15+ Upvotes</span>
                  <span className="rule-pts">+15 pts</span>
                </li>
                <li>
                  <span className="rule-name">⭐ Weekly Pulse Rating</span>
                  <span className="rule-pts">+2 pts</span>
                </li>
                <li>
                  <span className="rule-name">⚡ Daily Active Login</span>
                  <span className="rule-pts">+1 pt</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Report Modal */}
      {reportingPostId && (
        <ReportModal
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSuccess={() => {
            setReportingPostId(null);
            setToast('🚩 Thank you. Your report was sent to HR/Admin for review.');
            setTimeout(() => setToast(''), 4000);
          }}
        />
      )}
    </div>
  );
}

export default Feed;