// src/pages/author/AuthorCameraReadyPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { ToastContainer } from "../../components/Toast";

const AuthorCameraReadyPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/submissions/${id}`);
        if (!ignore) setSubmission(res.data || null);
      } catch (err) {
        if (!ignore)
          setLoadError(err?.response?.data?.message || err?.message || t('author.cameraReady.loadError'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (id) load();
    return () => (ignore = true);
  }, [id, t]);

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) {
      setFile(null);
      return;
    }
    if (!uploaded.type.includes("pdf")) {
      addToast(t('author.cameraReady.pdfOnly'), "error");
      return;
    }
    setFile(uploaded);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast(t('author.cameraReady.fileRequired'), "error");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post(`/camera-ready/${id}`, formData);
      const camPath = res?.data?.cameraReadyPath || res?.data?.cameraReady_path || res?.data?.camera_ready_path;
      const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/api$/, "");
      const camUrl = res?.data?.cameraReadyDownloadUrl || (camPath ? `${base}/uploads/camera-ready/${camPath}` : null);
      setSubmission((s) => ({
        ...(s || {}),
        cameraReadyPath: camPath,
        cameraReadyDownloadUrl: camUrl,
      }));
      addToast(t('author.cameraReady.uploadSuccess'), "success");
      
      setTimeout(() => {
        navigate(`/author/submissions/${id}/reviews`);
      }, 2000);
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || t('author.cameraReady.uploadFailed'), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout roleLabel="Author" title={t('author.cameraReady.title')}>
      <div style={{ marginBottom: "1rem" }}>
        <button 
          className="btn-back" 
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem", background: "transparent", border: "1.5px solid #e2e8f0",
            borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
            color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem"
          }}
        >
          ← {t('author.cameraReady.backToDetails')}
        </button>
      </div>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author/submissions" className="breadcrumb-link">
              {t('common.submissions')}
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Camera-ready</span>
          </div>
          <h2 className="data-page-title">Camera-ready</h2>
          <p className="data-page-subtitle">{t('author.cameraReady.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem" }}>{t('app.loading')}</div>
      ) : (
        <div className="form-card">
          {loadError && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>{loadError}</div>
          )}

          {submission && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>{submission.title}</strong>
              <div style={{ color: "#666", marginTop: 6 }}>
                {t('common.status')}: {submission.status || submission.reviewStatus}
              </div>
            </div>
          )}

          {submission && submission.cameraReadyDownloadUrl ? (
            <div style={{ marginTop: 12 }}>
              <div className="auth-success" style={{ marginBottom: 8 }}>
                {t('author.cameraReady.alreadySubmitted')}
              </div>
              <div>
                <a href={submission.cameraReadyDownloadUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: "6px 10px" }}>
                  {t('author.cameraReady.downloadCameraReady')}
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="file">{t('author.cameraReady.fileLabel')}</label>
                <input id="file" type="file" accept="application/pdf" onChange={handleFileChange} />
                <div className="field-hint">{t('author.cameraReady.fileHint')}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Link to="/author/submissions" className="btn-secondary">
                  {t('app.back')}
                </Link>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? t('app.loading') : t('app.upload')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default AuthorCameraReadyPage;
