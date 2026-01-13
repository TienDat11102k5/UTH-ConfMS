// src/components/LoadingText.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/LoadingText.css";

/**
 * LoadingText component - Hiển thị text với animation dấu "..." động
 * @param {String} text - Text hiển thị (mặc định: "Đang tải")
 * @param {String} className - CSS class tùy chỉnh
 * @param {Object} style - Inline styles
 */
const LoadingText = ({ text = null, className = "", style = {} }) => {
  const { t } = useTranslation();
  const displayText = text || t('app.loading');

  return (
    <div 
      className={`loading-text-container ${className}`} 
      style={style}
      role="status"
      aria-live="polite"
      aria-label={displayText}
    >
      <span className="loading-text" aria-hidden="true">{displayText}</span>
      <span className="loading-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </div>
  );
};

export default LoadingText;
