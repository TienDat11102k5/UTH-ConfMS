/**
 * SynopsisCard Component
 * Displays AI-generated synopsis with key points in a collapsible card.
 */
import React, { useState } from "react";
import "./SynopsisCard.css";

const SynopsisCard = ({
  synopsis,
  keyThemes = [],
  methodology,
  contributionType,
  wordCount,
  onReportInaccuracy = null,
  synopsisId = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIssue, setReportIssue] = useState("");

  const handleReport = () => {
    if (reportIssue.trim() && onReportInaccuracy) {
      onReportInaccuracy(synopsisId, reportIssue);
      setShowReportForm(false);
      setReportIssue("");
    }
  };

  return (
    <div className="synopsis-card">
      <div className="synopsis-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="synopsis-title">
          <span className="icon">{isExpanded ? "▼" : "▶"}</span>
          <span>AI-Generated Synopsis</span>
          {wordCount && <span className="word-count">({wordCount} words)</span>}
        </div>
        <div className="synopsis-badge">AI</div>
      </div>

      {isExpanded && (
        <div className="synopsis-content">
          <div className="synopsis-disclaimer">
            ⚠️ This is AI-generated content for reviewer assistance. Please verify accuracy.
          </div>

          <div className="synopsis-text">{synopsis}</div>

          {keyThemes && keyThemes.length > 0 && (
            <div className="key-themes">
              <strong>Key Themes:</strong>
              <div className="themes-list">
                {keyThemes.map((theme, index) => (
                  <span key={index} className="theme-tag">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="synopsis-metadata">
            {methodology && (
              <div className="metadata-item">
                <strong>Methodology:</strong> {methodology}
              </div>
            )}
            {contributionType && (
              <div className="metadata-item">
                <strong>Contribution:</strong> {contributionType}
              </div>
            )}
          </div>

          {showReportForm ? (
            <div className="report-form">
              <textarea
                placeholder="Describe the inaccuracy..."
                value={reportIssue}
                onChange={(e) => setReportIssue(e.target.value)}
                rows={3}
              />
              <div className="report-actions">
                <button onClick={handleReport} className="submit-button">
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setReportIssue("");
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReportForm(true)}
              className="report-button"
            >
              Report Inaccuracy
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SynopsisCard;




