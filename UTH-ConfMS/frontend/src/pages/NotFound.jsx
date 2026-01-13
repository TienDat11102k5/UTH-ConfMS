// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('errors.notFoundTitle')}</h1>
        <p className="auth-subtitle">
          {t('errors.notFoundDescription')}
        </p>

        <div style={{ marginTop: "16px" }}>
          <Link to="/" className="link-inline">
            {t('errors.backToPortal')}
          </Link>
        </div>

        <div className="auth-footer">
          <span>{t('common.or')} </span>
          <Link to="/login" className="link-inline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

