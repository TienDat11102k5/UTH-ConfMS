// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCurrentUser, setCurrentUser } from "../auth";
import apiClient from "../apiClient";
import Toast, { toastStyles } from "../components/Toast";
import "../styles/UserProfilePage.css";

const UserProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUserState, setCurrentUserState] = useState(getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    affiliation: "",
    gender: "",
    address: "",
    bio: "",
  });
  const [originalFormData, setOriginalFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!currentUserState) {
      navigate("/login");
      return;
    }
    const userData = {
      fullName: currentUserState.fullName || currentUserState.name || "",
      dateOfBirth: currentUserState.dateOfBirth || "",
      email: currentUserState.email || "",
      phone: currentUserState.phone || "",
      affiliation: currentUserState.affiliation || "",
      gender: currentUserState.gender || "",
      address: currentUserState.address || "",
      bio: currentUserState.bio || "",
    };

    setFormData(userData);
    setOriginalFormData(userData);
    setAvatarPreview(
      currentUserState.photoURL ||
        currentUserState.avatarUrl ||
        currentUserState.avatar
    );

    const loadProfile = async () => {
      try {
        setFetchingProfile(true);
        const res = await apiClient.get("/user/profile");
        if (!res?.data) return;
        const refreshed = {
          fullName: res.data.fullName || res.data.name || "",
          dateOfBirth: res.data.dateOfBirth || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          affiliation: res.data.affiliation || "",
          gender: res.data.gender || "",
          address: res.data.address || "",
          bio: res.data.bio || "",
          avatar: res.data.avatarUrl || res.data.avatar || res.data.photoURL,
        };
        setFormData((prev) => ({ ...prev, ...refreshed }));
        setOriginalFormData(refreshed);
        setAvatarPreview(
          refreshed.avatar ||
            currentUserState.photoURL ||
            currentUserState.avatarUrl ||
            currentUserState.avatar
        );
        const updatedUser = { ...currentUserState, ...res.data };
        setCurrentUser(updatedUser, { remember: true });
        setCurrentUserState(updatedUser);
      } catch (err) {
        console.error("Could not load latest profile:", err);
      } finally {
        setFetchingProfile(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const phoneRegex = /^[0-9]*$/;
    if (phoneRegex.test(value) && value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: t('profilePage.avatarSizeError'), type: "error" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setToast({ message: t('profilePage.avatarTypeError'), type: "error" });
      return;
    }
    setUploadingAvatar(true);
    setToast(null);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await apiClient.post("/user/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const updatedUser = { ...currentUserState, ...res.data };
      setCurrentUser(updatedUser, { remember: true });
      setCurrentUserState(updatedUser);
      setToast({ message: t('profilePage.avatarUploadSuccess'), type: "success" });
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || t('profilePage.avatarUploadError'),
        type: "error"
      });
      setAvatarPreview(
        currentUserState.photoURL ||
          currentUserState.avatarUrl ||
          currentUserState.avatar
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(originalFormData);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setToast(null);
    setLoading(true);

    try {
      const payload = { ...formData };

      if (!payload.phone || payload.phone.trim() === "") {
        delete payload.phone;
      }

      if (!payload.dateOfBirth) {
        delete payload.dateOfBirth;
      }

      const res = await apiClient.put("/user/profile", payload);

      const updatedUser = { ...currentUserState, ...res.data };
      setCurrentUser(updatedUser, { remember: true });
      setCurrentUserState(updatedUser);

      setOriginalFormData(payload);
      setIsEditing(false);
      setToast({ message: t('profilePage.updateSuccess'), type: "success" });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Profile update error:", err);

      let errorMessage = t('profilePage.updateError');
      if (err?.response?.status === 401) {
        errorMessage = t('errors.sessionExpired');
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setToast({ message: errorMessage, type: "error" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserState) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div style={toastStyles.container}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
      
      <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>{t('profilePage.title')}</h1>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← {t('common.back')}
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {fetchingProfile && (
          <div className="alert profile-alert-loading">
            {t('profilePage.loadingProfile')}
          </div>
        )}
        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="profile-avatar-large"
                />
              ) : (
                <div className="profile-avatar-placeholder-large">
                  {getInitials(formData.fullName)}
                </div>
              )}
              {uploadingAvatar && (
                <div className="avatar-uploading">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <label className="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="visually-hidden"
                />
                {uploadingAvatar ? t('app.uploading') : t('profilePage.changeAvatar')}
              </label>
              <p className="avatar-hint">{t('profilePage.avatarHint')}</p>
            </div>
          </div>
          {/* Profile Form */}
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="profile-section-header">
                <h2>{t('profilePage.basicInfo')}</h2>
                {!isEditing && (
                  <button
                    type="button"
                    className="btn-primary profile-edit-btn"
                    onClick={handleEditClick}
                  >
                    {t('common.edit')}
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">{t('profilePage.fullName')} *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">{t('profilePage.dateOfBirth')}</label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">{t('profilePage.phone')}</label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="^0[0-9]{9}$"
                    value={formData.phone || ""}
                    onChange={handlePhoneChange}
                    placeholder={t('profilePage.phonePlaceholder')}
                    disabled={!isEditing}
                    maxLength="10"
                    title={t('profilePage.phoneTitle')}
                  />
                  {isEditing && formData.phone && formData.phone.length > 0 && (
                    <small
                      style={{
                        color:
                          formData.phone.length === 10 &&
                          formData.phone.startsWith("0")
                            ? "#16a34a"
                            : "#dc2626",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {!formData.phone.startsWith("0")
                        ? t('profilePage.phoneMustStartWith0')
                        : formData.phone.length < 10
                        ? t('profilePage.phoneDigitsLeft', { count: 10 - formData.phone.length })
                        : t('profilePage.phoneValid')}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="gender">{t('profilePage.gender')}</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={
                      isEditing
                        ? {
                            backgroundColor: "white",
                            cursor: "pointer",
                            opacity: 1,
                          }
                        : {}
                    }
                  >
                    <option value="">{t('profilePage.selectGender')}</option>
                    <option value="Nam">{t('profilePage.male')}</option>
                    <option value="Nữ">{t('profilePage.female')}</option>
                    <option value="Khác">{t('profilePage.other')}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">{t('auth.email')} *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                  title={t('profilePage.emailCannotChange')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="affiliation">{t('profilePage.affiliation')}</label>
                <input
                  id="affiliation"
                  name="affiliation"
                  type="text"
                  value={formData.affiliation || ""}
                  onChange={handleChange}
                  placeholder={t('profilePage.affiliationPlaceholder')}
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">{t('profilePage.address')}</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder={t('profilePage.addressPlaceholder')}
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="bio">{t('profilePage.bio')}</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  placeholder={t('profilePage.bioPlaceholder')}
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
            </div>
            {isEditing && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? t('app.saving') : t('common.saveChanges')}
                </button>
              </div>
            )}
          </form>
          {/* Account Info */}
          <div className="account-info-section">
            <h2>{t('profilePage.accountInfo')}</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">{t('profilePage.role')}:</span>
                <span className="info-value">
                  {currentUserState.role?.replace("ROLE_", "") || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('profilePage.status')}:</span>
                <span className="info-value status-active">{t('profilePage.active')}</span>
              </div>
              {currentUserState.createdAt && (
                <div className="info-item">
                  <span className="info-label">{t('profilePage.createdAt')}:</span>
                  <span className="info-value">
                    {new Date(currentUserState.createdAt).toLocaleDateString(
                      i18n.language === 'vi' ? "vi-VN" : "en-US"
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default UserProfilePage;
