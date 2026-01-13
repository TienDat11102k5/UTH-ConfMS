// src/pages/SettingsPage.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "../auth";
import apiClient from "../apiClient";
import { ToastContainer } from "../components/Toast";
import "../styles/SettingsPage.css";

const SettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Add toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Remove toast helper
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast(t('settings.passwordMismatch'), "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast(t('settings.passwordTooShort'), "error");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      addToast(t('settings.passwordChangeSuccess'), "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.message ||
        t('settings.passwordChangeError');
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const isGoogleUser = currentUser.provider === "GOOGLE";

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>{t('settings.title')}</h1>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← {t('common.back')}
          </button>
        </div>


        <div className="settings-content">
          {/* Password Section - Only for LOCAL users */}
          {!isGoogleUser && (
            <div className="settings-section">
              <h2>{t('settings.changePassword')}</h2>
              <p className="section-description">
                {t('settings.changePasswordDescription')}
              </p>

              <form className="settings-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">{t('auth.currentPassword')} *</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder={t('settings.currentPasswordPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">{t('auth.newPassword')} *</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder={t('settings.newPasswordPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">{t('auth.confirmNewPassword')} *</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder={t('settings.confirmPasswordPlaceholder')}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('app.processing') : t('settings.changePassword')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isGoogleUser && (
            <div className="settings-section">
              <h2>{t('settings.changePassword')}</h2>
              <div className="info-box">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                    fill="#3b82f6"
                  />
                </svg>
                <p>
                  {t('settings.googleAccountInfo')}
                </p>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SettingsPage;
