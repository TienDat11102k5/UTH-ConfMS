// src/components/LoadingText.jsx
import React from "react";
import "../styles/LoadingText.css";

/**
 * LoadingText component - Hiển thị text với animation dấu "..." động
 * @param {String} text - Text hiển thị (mặc định: "Đang tải")
 * @param {String} className - CSS class tùy chỉnh
 * @param {Object} style - Inline styles
 */
const LoadingText = ({ text = "Đang tải", className = "", style = {} }) => {
  return (
    <div 
      className={`loading-text-container ${className}`} 
      style={style}
      role="status"
      aria-live="polite"
      aria-label={`${text}, vui lòng chờ`}
    >
      <span className="loading-text" aria-hidden="true">{text}</span>
      <span className="loading-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </div>
  );
};

export default LoadingText;
