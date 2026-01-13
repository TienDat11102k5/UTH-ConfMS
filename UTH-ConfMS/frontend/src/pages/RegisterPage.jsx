// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import LanguageSwitcher from "../components/LanguageSwitcher";

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = t('validation.required');
    } else if (fullName.trim().length < 2) {
      errors.fullName = t('validation.minLength');
    }

    if (!email || email.trim().length === 0) {
      errors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('validation.emailInvalid');
    }

    if (!password || password.length === 0) {
      errors.password = t('validation.required');
    } else if (password.length < 6) {
      errors.password = t('validation.passwordLength');
    }

    if (!passwordConfirm || passwordConfirm.length === 0) {
      errors.passwordConfirm = t('validation.required');
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = t('validation.passwordMismatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    if (!validateForm()) {
      setError(t('validation.checkForm'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        affiliation: affiliation.trim() || undefined,
        email: email.trim().toLowerCase(),
        password: password,
      };

      const response = await apiClient.post("/auth/register", payload);

      setSuccessMsg(t('auth.registerSuccess'));

      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: t('auth.registerSuccess'),
            email: email.trim().toLowerCase() 
          } 
        });
      }, 1500);

    } catch (err) {
      console.error("Register error:", err);
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          const message = data.message || data.error || t('validation.checkForm');
          setError(message);
          if (data.errors && typeof data.errors === "object") {
            setFieldErrors(data.errors);
          }
        } else if (status === 409) {
          setError(t('validation.emailExists'));
          setFieldErrors({ email: t('validation.emailExists') });
        } else if (status === 500) {
          setError(t('errors.serverError'));
        } else {
          setError(data.message || t('auth.registerFailed'));
        }
      } else if (err.request) {
        setError(t('errors.networkError'));
      } else {
        setError(t('app.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-register">
      <div className="auth-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <LanguageSwitcher />
        </div>
        <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        
        {successMsg && <div className="auth-success">{successMsg}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">
              {t('common.fullName')} <span className="required">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
              }}
              placeholder={t('auth.fullNamePlaceholder')}
              className={fieldErrors.fullName ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="affiliation">{t('common.affiliation')}</label>
            <input
              id="affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder={t('auth.affiliationPlaceholder')}
              disabled={loading}
            />
            <small className="form-hint">{t('auth.affiliationHint')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('common.email')} <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              placeholder="you@example.com"
              className={fieldErrors.email ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {t('auth.password')} <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
              }}
              placeholder="••••••••"
              className={fieldErrors.password ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            <small className="form-hint">{t('validation.passwordLength')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">
              {t('auth.confirmPassword')} <span className="required">*</span>
            </label>
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                if (fieldErrors.passwordConfirm) setFieldErrors({ ...fieldErrors, passwordConfirm: undefined });
              }}
              placeholder="••••••••"
              className={fieldErrors.passwordConfirm ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.passwordConfirm && <span className="field-error">{fieldErrors.passwordConfirm}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('app.loading') : t('auth.register')}
          </button>
        </form>

        <div className="auth-footer">
          <span>{t('auth.hasAccount')}</span>{" "}
          <Link to="/login" className="link-inline">{t('auth.login')}</Link>
        </div>

        <div className="auth-footer">
          <span>{t('auth.orBackTo')}</span>{" "}
          <Link to="/" className="link-inline">{t('nav.portal')}</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
