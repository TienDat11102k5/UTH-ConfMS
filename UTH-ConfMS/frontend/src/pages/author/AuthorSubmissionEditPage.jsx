// src/pages/author/AuthorSubmissionEditPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const AuthorSubmissionEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setError("");
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
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Không tải được submission."
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [id, navigate]);

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
    setError("");
    setSuccess("");
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
      setSuccess("Cập nhật submission thành công.");
      setTimeout(() => navigate("/author/submissions"), 800);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/login");
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể cập nhật submission."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <section className="dash-section">Đang tải submission...</section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <section className="dash-section">
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">
                  Portal
                </Link>
                <span className="breadcrumb-separator">/</span>
                <Link to="/author/submissions" className="breadcrumb-link">
                  Author submissions
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Sửa bài báo #{id}</span>
              </div>
              <h1 className="data-page-title">Sửa bài báo</h1>
              <p className="data-page-subtitle">
                Chỉ cho phép sửa tiêu đề, tóm tắt và file trước deadline khi
                trạng thái còn SUBMITTED.
              </p>
            </div>
          </div>

          {success && (
            <div className="auth-success" style={{ marginBottom: "1rem" }}>
              {success}
            </div>
          )}
          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {meta && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "12px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {meta.title || "Submission"}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Track: {meta.trackName || meta.trackId || "-"}</span>
                <span>Hội nghị: {meta.conferenceName || "-"}</span>
                <span>
                  Trạng thái: {meta.status || meta.reviewStatus || "-"}
                </span>
              </div>
            </div>
          )}

          <div className="form-card">
            <form className="submission-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">
                  Tiêu đề bài báo <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="text-input"
                  required
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="abstractText">
                  Tóm tắt (Abstract) <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  id="abstractText"
                  name="abstractText"
                  className="textarea-input"
                  required
                  value={form.abstractText}
                  onChange={handleChange}
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="file">File bài báo (PDF) (tùy chọn)</label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
                <div className="field-hint">
                  Để trống nếu không muốn thay file. File mới sẽ thay thế file
                  cũ.
                </div>
                {meta?.downloadUrl && (
                  <div className="field-hint">
                    File hiện tại:{" "}
                    <a href={meta.downloadUrl} target="_blank" rel="noreferrer">
                      Tải xuống
                    </a>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/author/submissions")}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorSubmissionEditPage;
