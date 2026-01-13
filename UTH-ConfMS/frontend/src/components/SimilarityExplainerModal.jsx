/**
 * SimilarityExplainerModal Component
 * Shows detailed explanation of reviewer-paper similarity match.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import "./SimilarityExplainerModal.css";

const SimilarityExplainerModal = ({
  isOpen,
  onClose,
  match,
  reviewerName = "",
  paperTitle = "",
}) => {
  const { t } = useTranslation();
  
  if (!isOpen || !match) return null;

  const getScoreColor = (score) => {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    return "low";
  };

  const getExpertiseMatchColor = (match) => {
    if (match === "high") return "high";
    if (match === "medium") return "medium";
    return "low";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content explainer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('components.similarityExplainer.title')}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="explainer-section">
            <h3>{t('components.similarityExplainer.reviewer')}: {reviewerName || match.reviewer_id}</h3>
            <h4>{t('components.similarityExplainer.paper')}: {paperTitle || t('common.unknown')}</h4>
          </div>

          <div className="score-section">
            <div className="score-display">
              <span className="score-label">{t('components.similarityExplainer.similarityScore')}:</span>
              <span className={`score-value ${getScoreColor(match.similarity_score)}`}>
                {(match.similarity_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="expertise-match">
              <span className="match-label">{t('components.similarityExplainer.expertiseMatch')}:</span>
              <span className={`match-badge ${getExpertiseMatchColor(match.expertise_match)}`}>
                {match.expertise_match.toUpperCase()}
              </span>
            </div>
          </div>

          {match.matching_keywords && match.matching_keywords.length > 0 && (
            <div className="keywords-section">
              <h4>{t('components.similarityExplainer.matchingKeywords')}</h4>
              <div className="keywords-list">
                {match.matching_keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {match.common_topics && match.common_topics.length > 0 && (
            <div className="topics-section">
              <h4>{t('components.similarityExplainer.commonTopics')}</h4>
              <ul className="topics-list">
                {match.common_topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {match.rationale && (
            <div className="rationale-section">
              <h4>{t('components.similarityExplainer.rationale')}</h4>
              <p>{match.rationale}</p>
            </div>
          )}

          <div className="disclaimer">
            <small>
              ⚠️ {t('components.similarityExplainer.disclaimer')}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityExplainerModal;
