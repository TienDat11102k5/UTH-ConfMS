/**
 * AbstractPolishModal Component
 * Modal component for abstract polishing with side-by-side comparison and diff viewer.
 */
import React, { useState, useEffect } from "react";
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
      setError("Vui lòng nhập abstract để đánh bóng.");
      return;
    }

    if (!conferenceId) {
      setError("Conference ID is required.");
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
      setError(err.message || "Đánh bóng abstract thất bại. Vui lòng thử lại.");
      console.error("Abstract polish error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!polishResult || !paperId) {
      setError("Không thể áp dụng. Vui lòng kiểm tra lại thông tin.");
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
      setError(err.message || "Áp dụng abstract thất bại. Vui lòng thử lại.");
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
          <h2>Đánh bóng Abstract</h2>
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
                  <span>Giữ nguyên ý nghĩa gốc</span>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={enhanceTone}
                    onChange={(e) => setEnhanceTone(e.target.checked)}
                  />
                  <span>Nâng cao giọng văn học thuật</span>
                </label>
              </div>

              <div className="original-preview">
                <h3>Abstract gốc:</h3>
                <div className="text-preview">{originalAbstract}</div>
              </div>

              <button
                type="button"
                onClick={handlePolish}
                disabled={loading}
                className="polish-button"
              >
                {loading ? "Đang xử lý..." : "Đánh bóng Abstract"}
              </button>
            </div>
          ) : (
            <div className="polish-results">
              <div className="rationale-section">
                <h3>Lý do cải thiện:</h3>
                <p>{polishResult.rationale}</p>
                {polishResult.confidence_score && (
                  <div className="confidence-score">
                    Độ tin cậy: {(polishResult.confidence_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              <div className="comparison-view">
                <div className="text-column">
                  <h3>Abstract gốc</h3>
                  <div className="text-content original-text">
                    {originalAbstract}
                  </div>
                </div>

                <div className="text-column">
                  <h3>Abstract đã đánh bóng</h3>
                  <div className="text-content polished-text">
                    {polishResult.polished}
                  </div>
                </div>
              </div>

              {polishResult.changes && polishResult.changes.length > 0 && (
                <div className="changes-section">
                  <h3>Các thay đổi ({polishResult.changes.length}):</h3>
                  <ul className="changes-list">
                    {polishResult.changes.map((change, index) => (
                      <li key={index} className="change-item">
                        <div className="change-type">
                          <span className="badge">{change.change_type}</span>
                        </div>
                        <div className="change-content">
                          <div className="change-before">
                            <strong>Trước:</strong> {change.before}
                          </div>
                          <div className="change-after">
                            <strong>Sau:</strong> {change.after}
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
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="apply-button"
                  disabled={applying || !paperId}
                >
                  {applying ? "Đang áp dụng..." : "Áp dụng Abstract mới"}
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


