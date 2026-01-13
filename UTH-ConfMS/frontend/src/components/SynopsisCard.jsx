/**
 * SynopsisCard Component
 * Displays AI-generated synopsis with key points in a collapsible card.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <span>{t('components.synopsis.title')}</span>
          {wordCount && <span className="word-count">({wordCount} {t('components.synopsis.words')})</span>}
        </div>
        <div className="synopsis-badge">AI</div>
      </div>

      {isExpanded && (
        <div className="synopsis-content">
          <div className="synopsis-disclaimer">
            ⚠️ {t('components.synopsis.disclaimer')}
          </div>

          <div className="synopsis-text">{synopsis}</div>

          {keyThemes && keyThemes.length > 0 && (
            <div className="key-themes">
              <strong>{t('components.synopsis.keyThemes')}:</strong>
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
                <strong>{t('components.synopsis.methodology')}:</strong> {methodology}
              </div>
            )}
            {contributionType && (
              <div className="metadata-item">
                <strong>{t('components.synopsis.contribution')}:</strong> {contributionType}
              </div>
            )}
          </div>

          {showReportForm ? (
            <div className="report-form">
              <textarea
                placeholder={t('components.synopsis.describeInaccuracy')}
                value={reportIssue}
                onChange={(e) => setReportIssue(e.target.value)}
                rows={3}
              />
              <div className="report-actions">
                <button onClick={handleReport} className="submit-button">
                  {t('app.submit')}
                </button>
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setReportIssue("");
                  }}
                  className="cancel-button"
                >
                  {t('app.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReportForm(true)}
              className="report-button"
            >
              {t('components.synopsis.reportInaccuracy')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SynopsisCard;
