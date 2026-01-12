// src/pages/author/AuthorSubmissionEditPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { ToastContainer } from "../../components/Toast";

const AuthorSubmissionEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [form, setForm] = useState({
    title: "",
    abstractText: "",
  });
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await apiClient.get(`/submissions/${id}`);
        if (ignore) return;
        setForm({
          title: res.data?.title || "",
          abstractText: res.data?.abstractText || "",
        });
        setMeta(res.data || {});
      } catch (err) {
        if (ignore) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }
        setLoadError(err?.response?.data?.message || err?.response?.data?.error || t('author.edit.loadError'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [id, navigate, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    setFile(uploaded || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("abstract", form.abstractText);
      if (file) {
        formData.append("file", file);
      }
      await apiClient.put(`/submissions/${id}`, formData);
      addToast(t('author.edit.updateSuccess'), "success");
      setTimeout(() => navigate("/author/submissions"), 800);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/login");
        return;
      }
      addToast(err?.response?.data?.message || err?.response?.data?.error || t('author.edit.updateError'), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <PortalHeader title="UTH Conference Portal · Author" ctaHref="/author/dashboard" ctaText={t('author.dashboard.title')} />
        <main className="dash-main">
          <section className="dash-section">{t('author.edit.loading')}</section>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dash-page">
        <PortalHeader title="UTH Conference Portal · Author" ctaHref="/author/dashboard" ctaText={t('author.dashboard.title')} />
        <main className="dash-main">
          <section className="dash-section">
            <div className="auth-error" style={{ marginBottom: "1rem" }}>{loadError}</div>
            <button className="btn-secondary" onClick={() => navigate(-1)}>{t('app.back')}</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <PortalHeader title="UTH Conference Portal · Author" ctaHref="/author/dashboard" ctaText={t('author.dashboard.title')} />
      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">Portal</Link>
                <span className="breadcrumb-separator">/</span>
                <Link to="/author/submissions" className="breadcrumb-link">{t('author.submissions.title')}</Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{t('author.edit.editPaper')} #{id}</span>
              </div>
              <h1 className="data-page-title">{t('author.edit.title')}</h1>
              <p className="data-page-subtitle">{t('author.edit.subtitle')}</p>
            </div>
          </div>

          {meta && (
            <div style={{ marginBottom: "1rem", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fafafa" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{meta.title || "Submission"}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>{t('common.track')}: {meta.trackName || meta.trackId || "-"}</span>
                <span>{t('common.conference')}: {meta.conferenceName || "-"}</span>
                <span>{t('common.status')}: {meta.status || meta.reviewStatus || "-"}</span>
              </div>
            </div>
          )}

          <div className="form-card">
            <form className="submission-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">{t('author.form.paperTitle')} <span style={{ color: "red" }}>*</span></label>
                <input id="title" name="title" type="text" className="text-input" required value={form.title} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="abstractText">{t('common.abstract')} <span style={{ color: "red" }}>*</span></label>
                <textarea id="abstractText" name="abstractText" className="textarea-input" required value={form.abstractText} onChange={handleChange} rows={6} />
              </div>

              <div className="form-group">
                <label htmlFor="file">{t('author.edit.fileOptional')}</label>
                <input id="file" name="file" type="file" accept="application/pdf" onChange={handleFileChange} />
                <div className="field-hint">{t('author.edit.fileHint')}</div>
                {meta?.downloadUrl && (
                  <div className="field-hint">
                    {t('author.edit.currentFile')}: <a href={meta.downloadUrl} target="_blank" rel="noreferrer">{t('app.download')}</a>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate("/author/submissions")} disabled={saving}>{t('app.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('app.loading') : t('app.save')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AuthorSubmissionEditPage;
