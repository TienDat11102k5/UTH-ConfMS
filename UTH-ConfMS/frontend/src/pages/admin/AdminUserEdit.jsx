// src/pages/admin/AdminUserEdit.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";

const AdminUserEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [user, setUser] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("");

  const roleOptions = ["AUTHOR", "REVIEWER", "CHAIR", "ADMIN"];

  useEffect(() => {
    const fetchUserFromList = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMsg("");
        const res = await apiClient.get("/admin/users");
        const list = res.data || [];
        const found = list.find((u) => String(u.id) === String(id));
        setUser(found || null);
        setNameDraft(found?.name || "");
        setRoleDraft(found?.role || "");
        setStatusDraft(found?.status || "");
        if (!found) setError(t('admin.userEdit.userNotFound'));
      } catch (err) {
        console.error(err);
        setError(t('admin.userEdit.loadError'));
      } finally { setLoading(false); }
    };
    fetchUserFromList();
  }, [id, t]);

  const handleSave = async () => {
    if (!user) return;
    if (saving) return;
    const nextName = (nameDraft || "").trim();
    const nextRole = (roleDraft || "").trim().toUpperCase();
    const nextStatus = statusDraft;
    const nameChanged = nextName && nextName !== (user.name || "");
    const roleChanged = nextRole && nextRole !== (user.role || "").toUpperCase();
    const statusChanged = nextStatus && nextStatus !== user.status;
    if (!nameChanged && !roleChanged && !statusChanged) { setSuccessMsg(t('admin.userEdit.noChanges')); return; }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");
      let updated = user;
      if (nameChanged) { const res = await apiClient.put(`/admin/users/${user.id}/name`, { fullName: nextName }); updated = res.data || updated; }
      if (roleChanged) { const res = await apiClient.put(`/admin/users/${user.id}/role`, { role: nextRole }); updated = res.data || updated; }
      if (statusChanged) { const enabled = nextStatus === "Active"; const res = await apiClient.put(`/admin/users/${user.id}/status`, { enabled }); updated = res.data || updated; }
      setUser(updated);
      setNameDraft(updated?.name || nextName);
      setRoleDraft(updated?.role || nextRole);
      setStatusDraft(updated?.status || nextStatus);
      setSuccessMsg(t('admin.userEdit.updateSuccess'));
    } catch (err) {
      console.error(err);
      const httpStatus = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || t('admin.userEdit.updateFailed');
      setError(`${t('app.error')}${httpStatus ? ` (HTTP ${httpStatus})` : ""}: ${msg}`);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminLayout title={t('app.loading')}>
        <div className="form-card">{t('admin.userEdit.loading')}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${t('admin.userEdit.title')} #${id}`} subtitle={t('admin.userEdit.subtitle')}>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/users" className="breadcrumb-link">{t('admin.users.title')}</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('app.edit')} #{id}</span>
          </div>
          <h2 className="data-page-title" style={{ marginBottom: '0.25rem' }}>{t('admin.userEdit.updateAccount')}</h2>
          <p className="data-page-subtitle" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('admin.userEdit.updateInfo')}</p>
        </div>
      </div>

      <div className="form-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('admin.userEdit.accountInfo')}</h3>

        {successMsg && (<div className="auth-success" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>{successMsg}</div>)}
        {error && (<div className="auth-error" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>{error}</div>)}

        <div className="form-grid" style={{ gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.name')}</label>
            <input value={nameDraft} onChange={(e) => { setNameDraft(e.target.value); if (successMsg) setSuccessMsg(""); }} disabled={!user || saving} placeholder={t('admin.userCreate.namePlaceholder')} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.email')}</label>
            <input value={user?.email || ""} disabled style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
          </div>
        </div>

        <div className="form-grid" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.role')}</label>
            <select value={roleDraft} onChange={(e) => { setRoleDraft(e.target.value); if (successMsg) setSuccessMsg(""); }} disabled={!user || saving} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
              {roleDraft && !roleOptions.includes(String(roleDraft).toUpperCase()) && (<option value={roleDraft}>{String(roleDraft).toUpperCase()} ({t('admin.userEdit.current')})</option>)}
              {roleOptions.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{t('common.status')}</label>
            <select value={statusDraft} onChange={(e) => { setStatusDraft(e.target.value); if (successMsg) setSuccessMsg(""); }} disabled={!user || saving} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
              <option value="Active">{t('status.active')}</option>
              <option value="Disabled">{t('admin.userEdit.disabled')}</option>
            </select>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
          <button type="button" className="btn-secondary" onClick={handleSave} disabled={!user || saving} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{saving ? t('app.loading') : t('app.save')}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{t('admin.userEdit.backToList')}</button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserEdit;
