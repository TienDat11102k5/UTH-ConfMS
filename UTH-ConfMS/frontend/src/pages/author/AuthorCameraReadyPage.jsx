// src/pages/author/AuthorCameraReadyPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const AuthorCameraReadyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/submissions/${id}`);
        if (!ignore) setSubmission(res.data || null);
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.message || err?.message || "Không thể tải submission.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (id) load();
    return () => (ignore = true);
  }, [id]);

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) {
      setFile(null);
      return;
    }
    if (!uploaded.type.includes("pdf")) {
      setError("Chỉ chấp nhận file PDF cho camera-ready.");
      return;
    }
    setFile(uploaded);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!file) {
      setError("Vui lòng chọn file PDF camera-ready.");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      // backend expected endpoint: POST /submissions/:id/camera-ready
      await apiClient.post(`/submissions/${id}/camera-ready`, formData);
      setSuccess("Tải lên camera-ready thành công.");
      setTimeout(() => navigate(`/author/submissions/${id}`), 900);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Tải lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout roleLabel="Author" title="Upload Camera-Ready">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author/submissions" className="breadcrumb-link">Bài nộp</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Camera-ready</span>
          </div>
          <h2 className="data-page-title">Camera-ready</h2>
          <p className="data-page-subtitle">Tải lên bản PDF cuối cùng cho submission được chấp nhận.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem" }}>Đang tải...</div>
      ) : (
        <div className="form-card">
          {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {success && <div className="auth-success" style={{ marginBottom: "1rem" }}>{success}</div>}

          {submission && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>{submission.title}</strong>
              <div style={{ color: "#666", marginTop: 6 }}>
                Trạng thái: {submission.status || submission.reviewStatus}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="file">File camera-ready (PDF)</label>
              <input id="file" type="file" accept="application/pdf" onChange={handleFileChange} />
              <div className="field-hint">Chỉ chấp nhận PDF. Kích thước tối đa theo quy định của hội nghị.</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/author/submissions" className="btn-secondary">Quay lại</Link>
              <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? "Đang tải..." : "Tải lên"}</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AuthorCameraReadyPage;
