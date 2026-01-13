/**
 * SpellCheckButton Component
 * Button component for spell checking with loading state and error display.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  const handleCheck = async () => {
    if (!text || text.trim().length === 0) {
      setError(t('components.spellCheck.enterText'));
      return;
    }

    if (!conferenceId) {
      setError(t('components.spellCheck.conferenceRequired'));
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
        setError(t('components.spellCheck.noErrors'));
      }
    } catch (err) {
      setError(err.message || t('components.spellCheck.checkFailed'));
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
        title={t('components.spellCheck.title')}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>{t('components.spellCheck.checking')}</span>
          </>
        ) : (
          <>
            <span className="icon">✓</span>
            <span>{t('components.spellCheck.title')}</span>
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
            <strong>{t('components.spellCheck.foundErrors', { count: errors.length })}</strong>
          </div>
          <ul className="errors-list">
            {errors.map((err, index) => (
              <li key={index} className="error-item">
                <span className="error-word">"{err.word}"</span>
                {err.suggestions && err.suggestions.length > 0 && (
                  <span className="suggestions">
                    {t('components.spellCheck.suggestions')}: {err.suggestions.join(", ")}
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
