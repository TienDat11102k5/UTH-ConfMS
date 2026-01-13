// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import LanguageSwitcher from "../components/LanguageSwitcher";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });

      // Navigate to OTP verification page
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        t('auth.forgotPasswordError');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <LanguageSwitcher />
        </div>
        <h1 className="auth-title">{t('auth.forgotPasswordTitle')}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('common.email')} *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('app.sending') : t('auth.sendOtp')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="link-inline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

