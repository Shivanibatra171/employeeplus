import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ReportModal from '../components/ReportModal';
import API from '../api/axios';
import './Feed.css';

const CATEGORIES = ['Complaint', 'Confession', 'Suggestion', 'Appreciation'];

function Feed() {
  const { refreshUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [sort, setSort] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('');

  const [category, setCategory] = useState('Suggestion');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  const [rating, setRating] = useState(0);
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
                <h3>💬 Share Feedback Anonymously</h3>
                <span className="anon-guarantee-badge">🔒 100% Anonymous</span>
              </div>

              <div className="category-selection-row">
                <label className="field-label">Category:</label>
                <div className="category-buttons">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cat-btn ${category === c ? 'cat-active' : ''}`}
                      onClick={() => setCategory(c)}
                    >
                      {c} {c === 'Suggestion' ? '(+8 pts)' : '(+5 pts)'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="What's happening in your team or company? Voice your honest feedback safely..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                required
              />

              <div className="create-post-footer">
                <label className="anon-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span>Post anonymously on feed (Always enabled)</span>
                </label>

                <button type="submit" className="btn-post-submit" disabled={posting}>
                  {posting ? 'Posting...' : 'Share Anonymously'}
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
                    key={c}
                    className={`pill-btn ${filterCategory === c ? 'pill-active' : ''}`}
                    onClick={() => setFilterCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="sort-box">
                <span>Sort by:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">🕒 Newest First</option>
                  <option value="upvoted">🔥 Most Upvoted</option>
                </select>
              </div>
            </div>

            {/* Posts List */}
            {loadingFeed ? (
              <div className="feed-loading">Loading anonymous posts...</div>
            ) : posts.length === 0 ? (
              <div className="empty-feed-card">
                <p>No feedback posts found in this category.</p>
                <span>Be the first employee to share feedback anonymously!</span>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div className="post-card-top">
                      <div className="post-meta-left">
                        <span className={`category-tag category-${post.category.toLowerCase()}`}>
                          {post.category}
                        </span>
                        <span className="anon-author-tag">🔒 Anonymous Coworker</span>
                      </div>
                      <span className="post-date">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="post-content">{post.content}</p>

                    <div className="post-card-bottom">
                      <button
                        className="upvote-btn"
                        onClick={() => handleUpvote(post.id)}
                        title="Upvote this post"
                      >
                        ▲ {post.upvotes} {post.upvotes === 1 ? 'Upvote' : 'Upvotes'}
                      </button>

                      <button
                        className="report-btn"
                        onClick={() => setReportingPostId(post.id)}
                        title="Report this post to Admin"
                      >
                        🚩 Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Weekly Rating & Info */}
          <aside className="feed-sidebar">
            <div className="sidebar-card rating-card">
              <h4>⭐ Weekly Pulse Rating</h4>
              <p className="sidebar-desc">How was your week at work? Rate anonymously to earn <strong>+2 points</strong>!</p>

              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn ${n <= rating ? 'star-filled' : ''}`}
                    onClick={() => handleRating(n)}
                    title={`Rate ${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {ratingMsg && <div className="rating-feedback">{ratingMsg}</div>}
            </div>

            <div className="sidebar-card points-rules-card">
              <h4>🪙 How to Earn Points</h4>
              <ul className="points-rules-list">
                <li><span>Suggestion Post:</span> <strong>+8 pts</strong></li>
                <li><span>Complaint / Confession / Appreciation:</span> <strong>+5 pts</strong></li>
                <li><span>Post Reaches 15+ Upvotes:</span> <strong>+15 pts</strong></li>
                <li><span>Weekly Pulse Rating:</span> <strong>+2 pts</strong></li>
                <li><span>Daily Login:</span> <strong>+1 pt</strong></li>
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