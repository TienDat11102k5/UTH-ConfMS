/**
 * SpellCheckButton Component
 * Button component for spell checking with loading state and error display.
 */
import React, { useState } from "react";
import { checkSpelling } from "../api/ai/authorAI";
import "./SpellCheckButton.css";

const SpellCheckButton = ({
  text,
  language = "en",
  conferenceId,
  userId = null,
  onErrorsFound = null,
  className = "",
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  const handleCheck = async () => {
    if (!text || text.trim().length === 0) {
      setError("Vui lòng nhập văn bản để kiểm tra chính tả.");
      return;
    }

    if (!conferenceId) {
      setError("Conference ID is required.");
      return;
    }

    setLoading(true);
    setError("");
    setErrors([]);

    try {
      const result = await checkSpelling(text, language, conferenceId, userId);
      
      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        if (onErrorsFound) {
          onErrorsFound(result.errors);
        }
      } else {
        setError("Không tìm thấy lỗi chính tả nào.");
      }
    } catch (err) {
      setError(err.message || "Kiểm tra chính tả thất bại. Vui lòng thử lại.");
      console.error("Spell check error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`spell-check-container ${className}`}>
      <button
        type="button"
        onClick={handleCheck}
        disabled={loading || disabled || !text}
        className="spell-check-button"
        title="Kiểm tra chính tả"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Đang kiểm tra...</span>
          </>
        ) : (
          <>
            <span className="icon">✓</span>
            <span>Kiểm tra chính tả</span>
          </>
        )}
      </button>

      {error && (
        <div className="spell-check-error" role="alert">
          {error}
        </div>
      )}

      {errors.length > 0 && (
        <div className="spell-check-results">
          <div className="results-header">
            <strong>Tìm thấy {errors.length} lỗi chính tả:</strong>
          </div>
          <ul className="errors-list">
            {errors.map((err, index) => (
              <li key={index} className="error-item">
                <span className="error-word">"{err.word}"</span>
                {err.suggestions && err.suggestions.length > 0 && (
                  <span className="suggestions">
                    Gợi ý: {err.suggestions.join(", ")}
                  </span>
                )}
                {err.context && (
                  <span className="context">({err.context})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SpellCheckButton;


