// src/pages/admin/AdminUserCreate.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";

const roles = ["ADMIN", "CHAIR", "REVIEWER", "AUTHOR"];

const AdminUserCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("AUTHOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!fullName || fullName.trim().length === 0) { errors.fullName = t('admin.userCreate.fullNameRequired'); }
    else if (fullName.trim().length < 2) { errors.fullName = t('admin.userCreate.fullNameMinLength'); }
    if (!email || email.trim().length === 0) { errors.email = t('admin.userCreate.emailRequired'); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { errors.email = t('admin.userCreate.emailInvalid'); }
    if (!password || password.length === 0) { errors.password = t('admin.userCreate.passwordRequired'); }
    else if (password.length < 6) { errors.password = t('admin.userCreate.passwordMinLength'); }
    if (!passwordConfirm || passwordConfirm.length === 0) { errors.passwordConfirm = t('admin.userCreate.confirmPasswordRequired'); }
    else if (password !== passwordConfirm) { errors.passwordConfirm = t('admin.userCreate.passwordMismatch'); }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setFieldErrors({});
    if (!validateForm()) { setError(t('admin.userCreate.checkInfo')); return; }

    setLoading(true);
    try {
      const payload = { fullName: fullName.trim(), email: email.trim().toLowerCase(), password };
      const res = await apiClient.post("/auth/register", payload, { skipAuth: true });

      const newUserId = res?.data?.user?.id;
      const desiredRole = String(role || "AUTHOR").toUpperCase();
      if (newUserId && desiredRole && desiredRole !== "AUTHOR") {
        try {
          await apiClient.put(`/admin/users/${newUserId}/role`, { role: desiredRole });
          setSuccessMsg(t('admin.userCreate.createRoleSuccess'));
          setTimeout(() => navigate("/admin/users"), 900);
          return;
        } catch (roleErr) {
          console.error("Failed to set role:", roleErr);
          setSuccessMsg(t('admin.userCreate.createSuccess'));
          setError(t('admin.userCreate.roleFailed'));
          setTimeout(() => navigate("/admin/users"), 1200);
          return;
        }
      }
      setSuccessMsg(t('admin.userCreate.createSuccessRedirect'));
      setTimeout(() => navigate("/admin/users"), 900);
    } catch (err) {
      console.error("Admin create user error:", err);
      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;
        if (status === 400) { setError(data?.message || data?.error || t('admin.userCreate.invalidInfo')); }
        else if (status === 409) { setError(t('admin.userCreate.emailExists')); setFieldErrors({ email: t('admin.userCreate.emailExistsShort') }); }
        else { setError(data?.message || t('admin.userCreate.createFailed')); }
      } else if (err?.request) { setError(t('admin.userCreate.networkError')); }
      else { setError(t('admin.userCreate.genericError')); }
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout title={t('admin.userCreate.title')}>
      <div className="data-page-header"><div className="data-page-header-left"><div className="breadcrumb"></div></div></div>

      <div className="form-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('admin.userCreate.accountInfo')}</h3>

        {successMsg && (<div className="auth-success" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>{successMsg}</div>)}
        {error && (<div className="auth-error" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>{error}</div>)}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.name')}</label>
              <input value={fullName} onChange={(e) => { setFullName(e.target.value); if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined })); }} placeholder={t('admin.userCreate.namePlaceholder')} disabled={loading} className={fieldErrors.fullName ? "error" : ""} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
              {fieldErrors.fullName && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.fullName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.email')}</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined })); }} placeholder="you@example.com" disabled={loading} className={fieldErrors.email ? "error" : ""} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
              {fieldErrors.email && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.email}</span>}
            </div>
          </div>

          <div className="form-grid" style={{ gap: '0.75rem', marginTop: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.password')}</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined })); }} placeholder="••••••••" disabled={loading} className={fieldErrors.password ? "error" : ""} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
              {fieldErrors.password && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('admin.userCreate.confirmPassword')}</label>
              <input type="password" value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); if (fieldErrors.passwordConfirm) setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined })); }} placeholder="••••••••" disabled={loading} className={fieldErrors.passwordConfirm ? "error" : ""} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
              {fieldErrors.passwordConfirm && (<span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.passwordConfirm}</span>)}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.role')}</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', width: '100%' }}>
              {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
            <small className="form-hint" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('admin.userCreate.roleHint')}</small>
          </div>

          <div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{loading ? t('app.loading') : t('admin.userCreate.createButton')}</button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{t('admin.userCreate.backToList')}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminUserCreate;
