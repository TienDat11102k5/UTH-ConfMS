// src/pages/ResetPasswordPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import LanguageSwitcher from "../components/LanguageSwitcher";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get verifiedToken from VerifyOtpPage
  const verifiedToken = location.state?.verifiedToken || "";
  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if no verified token
  useEffect(() => {
    if (!verifiedToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [verifiedToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (newPassword !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token: verifiedToken,
        newPassword,
      });

      setSuccessMsg(t('auth.resetPasswordSuccessRedirect'));

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        t('auth.resetPasswordError');
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
        <h1 className="auth-title">{t('auth.resetPasswordTitle')}</h1>
        {email && (
          <p className="auth-subtitle">
            {t('auth.resetPasswordFor')}: <strong>{email}</strong>
          </p>
        )}

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">{t('auth.newPassword')} *</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">{t('auth.confirmNewPassword')} *</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('app.updating') : t('auth.updatePassword')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="link-inline">
            {t('auth.backToLogin')}
          </Link>
        </div>

        <div className="auth-footer">
          <Link to="/forgot-password" className="link-inline">
            {t('auth.resendForgotPassword')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

