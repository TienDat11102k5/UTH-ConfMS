// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";

const BackButton = ({ 
  text = null, 
  to = null, 
  className = "", 
  style = {},
  showIcon = true 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const buttonText = text || t('common.back');

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const defaultStyle = {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
    ...style
  };

  return (
    <button 
      className={`btn-back ${className}`}
      onClick={handleClick}
      style={defaultStyle}
      aria-label={buttonText}
      title={buttonText}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "#f8fafc";
        e.currentTarget.style.borderColor = "#cbd5e1";
        e.currentTarget.style.transform = "translateX(-2px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {showIcon && <FiArrowLeft />}
      {buttonText}
    </button>
  );
};

export default BackButton;
