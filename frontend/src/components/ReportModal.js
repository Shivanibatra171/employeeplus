import React, { useState } from 'react';
import API from '../api/axios';
import './ReportModal.css';

const REPORT_REASONS = [
  'Inappropriate or offensive content',
  'Harassment, bullying, or discrimination',
  'Spam or irrelevant feedback',
  'Breach of company confidentiality',
  'Other violation'
];

function ReportModal({ postId, onClose, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const finalReason = customNote.trim()
      ? `${selectedReason} — ${customNote.trim()}`
      : selectedReason;

    try {
      await API.post(`/posts/${postId}/report`, { reason: finalReason });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Post to HR/Admin</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-desc">
              Reports are reviewed discreetly by Admin/HR. Your report is completely confidential.
            </p>

            {error && <div className="modal-error">{error}</div>}

            <label className="modal-label">Select reason for reporting:</label>
            <div className="reason-options">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="reason-radio-label">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <label className="modal-label" style={{ marginTop: '12px' }}>
              Additional details (optional):
            </label>
            <textarea
              className="modal-textarea"
              placeholder="Provide more context for the HR moderation team..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
