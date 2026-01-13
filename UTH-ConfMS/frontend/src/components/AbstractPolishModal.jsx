/**
 * AbstractPolishModal Component
 * Modal component for abstract polishing with side-by-side comparison and diff viewer.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { polishAbstract, applyPolish } from "../api/ai/authorAI";
import "./AbstractPolishModal.css";

const AbstractPolishModal = ({
  isOpen,
  onClose,
  originalAbstract,
  language = "en",
  conferenceId,
  paperId = null,
  userId = null,
  onApply = null,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polishResult, setPolishResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [preserveMeaning, setPreserveMeaning] = useState(true);
  const [enhanceTone, setEnhanceTone] = useState(true);

  useEffect(() => {
    if (isOpen && originalAbstract) {
      setError("");
      setPolishResult(null);
    }
  }, [isOpen, originalAbstract]);

  const handlePolish = async () => {
    if (!originalAbstract || originalAbstract.trim().length === 0) {
      setError(t('components.abstractPolish.enterAbstract'));
      return;
    }

    if (!conferenceId) {
      setError(t('components.abstractPolish.conferenceRequired'));
      return;
    }

    setLoading(true);
    setError("");
    setPolishResult(null);

    try {
      const result = await polishAbstract(
        originalAbstract,
        language,
        conferenceId,
        paperId,
        userId,
        preserveMeaning,
        enhanceTone
      );

      setPolishResult(result);
    } catch (err) {
      setError(err.message || t('components.abstractPolish.polishFailed'));
      console.error("Abstract polish error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!polishResult || !paperId) {
      setError(t('components.abstractPolish.cannotApply'));
      return;
    }

    setApplying(true);
    setError("");

    try {
      await applyPolish(paperId, polishResult.polished, userId, conferenceId);
      
      if (onApply) {
        onApply(polishResult.polished);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || t('components.abstractPolish.applyFailed'));
      console.error("Apply polish error:", err);
    } finally {
      setApplying(false);
    }
  };

  const handleReject = () => {
    setPolishResult(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('components.abstractPolish.title')}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {!polishResult ? (
            <div className="polish-form">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={preserveMeaning}
                    onChange={(e) => setPreserveMeaning(e.target.checked)}
                  />
                  <span>{t('components.abstractPolish.preserveMeaning')}</span>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={enhanceTone}
                    onChange={(e) => setEnhanceTone(e.target.checked)}
                  />
                  <span>{t('components.abstractPolish.enhanceTone')}</span>
                </label>
              </div>

              <div className="original-preview">
                <h3>{t('components.abstractPolish.originalAbstract')}:</h3>
                <div className="text-preview">{originalAbstract}</div>
              </div>

              <button
                type="button"
                onClick={handlePolish}
                disabled={loading}
                className="polish-button"
              >
                {loading ? t('app.processing') : t('components.abstractPolish.polishButton')}
              </button>
            </div>
          ) : (
            <div className="polish-results">
              <div className="rationale-section">
                <h3>{t('components.abstractPolish.improvementReason')}:</h3>
                <p>{polishResult.rationale}</p>
                {polishResult.confidence_score && (
                  <div className="confidence-score">
                    {t('components.abstractPolish.confidence')}: {(polishResult.confidence_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              <div className="comparison-view">
                <div className="text-column">
                  <h3>{t('components.abstractPolish.originalAbstract')}</h3>
                  <div className="text-content original-text">
                    {originalAbstract}
                  </div>
                </div>

                <div className="text-column">
                  <h3>{t('components.abstractPolish.polishedAbstract')}</h3>
                  <div className="text-content polished-text">
                    {polishResult.polished}
                  </div>
                </div>
              </div>

              {polishResult.changes && polishResult.changes.length > 0 && (
                <div className="changes-section">
                  <h3>{t('components.abstractPolish.changes')} ({polishResult.changes.length}):</h3>
                  <ul className="changes-list">
                    {polishResult.changes.map((change, index) => (
                      <li key={index} className="change-item">
                        <div className="change-type">
                          <span className="badge">{change.change_type}</span>
                        </div>
                        <div className="change-content">
                          <div className="change-before">
                            <strong>{t('components.abstractPolish.before')}:</strong> {change.before}
                          </div>
                          <div className="change-after">
                            <strong>{t('components.abstractPolish.after')}:</strong> {change.after}
                          </div>
                          {change.explanation && (
                            <div className="change-explanation">
                              {change.explanation}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleReject}
                  className="reject-button"
                  disabled={applying}
                >
                  {t('common.reject')}
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="apply-button"
                  disabled={applying || !paperId}
                >
                  {applying ? t('app.processing') : t('components.abstractPolish.applyNew')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbstractPolishModal;
