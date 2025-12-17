// src/pages/author/AuthorNewSubmissionPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const formatDateTime = (value) => {
  if (!value) return "Đang cập nhật";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const AuthorNewSubmissionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confId = searchParams.get("confId");

  const [conference, setConference] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingConf, setLoadingConf] = useState(false);
  const [confError, setConfError] = useState("");

  const [formValues, setFormValues] = useState({
    title: "",
    abstractText: "",
    keywords: "",
    trackId: "",
  });
  const [file, setFile] = useState(null);
  const [coAuthors, setCoAuthors] = useState([
    { name: "", email: "", affiliation: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!confId) return;
    let ignore = false;

    const loadConference = async () => {
      setLoadingConf(true);
      setConfError("");
      try {
        const res = await apiClient.get(`/conferences/${confId}`, {
          skipAuth: true,
        });
        if (ignore) return;
        setConference(res.data);
        const fetchedTracks = Array.isArray(res.data?.tracks)
          ? res.data.tracks
          : [];
        setTracks(fetchedTracks);
        if (fetchedTracks.length) {
          setFormValues((prev) => ({
            ...prev,
            trackId:
              prev.trackId ||
              (fetchedTracks[0].id ? String(fetchedTracks[0].id) : ""),
          }));
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading conference", err);
          setConfError(
            "Không tải được thông tin hội nghị. Bạn vẫn có thể nhập Track ID thủ công."
          );
        }
      } finally {
        if (!ignore) setLoadingConf(false);
      }
    };

    loadConference();
    return () => {
      ignore = true;
    };
  }, [confId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    setFile(uploaded || null);
  };

  const handleCoAuthorChange = (index, field, value) => {
    setCoAuthors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addCoAuthor = () => {
    setCoAuthors((prev) => [...prev, { name: "", email: "", affiliation: "" }]);
  };

  const removeCoAuthor = (index) => {
    setCoAuthors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const payloadTrackId =
      formValues.trackId || (tracks[0]?.id ? String(tracks[0].id) : "");

    if (!payloadTrackId) {
      setError("Vui lòng chọn hoặc nhập Track ID hợp lệ.");
      return;
    }

    if (!file) {
      setError("Vui lòng chọn file PDF bài báo để nộp.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("abstract", formValues.abstractText);
      formData.append("trackId", payloadTrackId);
      if (formValues.keywords) {
        formData.append("keywords", formValues.keywords);
      }
      // Đồng tác giả (tùy chọn)
      if (coAuthors?.length) {
        const filled = coAuthors.filter(
          (c) => c.name?.trim() || c.email?.trim() || c.affiliation?.trim()
        );
        if (filled.length) {
          formData.append("coAuthors", JSON.stringify(filled));
        }
      }
      formData.append("file", file);

      // Spring Boot: POST /api/submissions (multipart/form-data)
      const res = await apiClient.post("/submissions", formData);

      setSuccessMessage("Nộp bài thành công.");
      setTimeout(() => {
        navigate("/author/submissions");
      }, 800);
    } catch (err) {
      console.error("Error submitting paper", err);
      const status = err?.response?.status;
      if (status === 401) {
        navigate("/login");
        return;
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Không thể nộp bài. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />

      <main className="dash-main">
        <section className="dash-section">
          {/* Header form */}
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
                <span className="breadcrumb-current">Nộp bài mới</span>
              </div>
              <h1 className="data-page-title">Nộp bài mới</h1>
              <p className="data-page-subtitle">
                Điền thông tin bài báo và tải file PDF để gửi cho hội nghị.
              </p>
            </div>
          </div>

          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          {successMessage && (
            <div className="auth-success" style={{ marginBottom: "1rem" }}>
              {successMessage}
            </div>
          )}
          {confError && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {confError}
            </div>
          )}
          {loadingConf && (
            <div style={{ marginBottom: "1rem", color: "#555" }}>
              Đang tải thông tin hội nghị...
            </div>
          )}
          {conference && (
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
                Hội nghị: {conference.name}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>
                  Hạn nộp bài:{" "}
                  {formatDateTime(conference.submissionDeadline)}
                </span>
                <span>
                  Hạn review: {formatDateTime(conference.reviewDeadline)}
                </span>
                <span>
                  Track đang mở: {tracks.length || "Đang cập nhật"}
                </span>
              </div>
            </div>
          )}

          {/* Form card */}
          <div className="form-card">
            <form className="submission-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Cột trái: thông tin text */}
                <div>
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
                      value={formValues.title}
                      onChange={handleChange}
                      placeholder="Ví dụ: Ứng dụng AI trong giao thông thông minh"
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
                      value={formValues.abstractText}
                      onChange={handleChange}
                      placeholder="Mô tả ngắn gọn nội dung, phương pháp và kết quả chính..."
                    />
                    <div className="field-hint">
                      Khoảng 150–300 từ, tiếng Anh hoặc tiếng Việt tùy theo yêu
                      cầu hội nghị.
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="keywords">Từ khóa (Keywords)</label>
                    <input
                      id="keywords"
                      name="keywords"
                      type="text"
                      className="text-input"
                      value={formValues.keywords}
                      onChange={handleChange}
                      placeholder="Ví dụ: AI, Machine Learning, Smart City"
                    />
                    <div className="field-hint">
                      Phân tách từ khóa bằng dấu phẩy.
                    </div>
                  </div>
                </div>

                {/* Cột phải: track + file */}
                <div>
                  <div className="form-group">
                    <label htmlFor="trackId">
                      Track / Chủ đề <span style={{ color: "red" }}>*</span>
                    </label>
                    {tracks.length > 0 ? (
                      <select
                        id="trackId"
                        name="trackId"
                        className="select-input"
                        required
                        value={formValues.trackId}
                        onChange={handleChange}
                      >
                        <option value="">-- Chọn track --</option>
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || `Track ${t.id}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="trackId"
                        name="trackId"
                        type="number"
                        min="1"
                        className="select-input"
                        required
                        value={formValues.trackId}
                        onChange={handleChange}
                        placeholder="Nhập ID track (ví dụ: 1, 2, 3...)"
                      />
                    )}
                    <div className="field-hint">
                      {tracks.length > 0
                        ? "Đã tải danh sách track từ hội nghị. Nếu không đúng, hãy chọn lại."
                        : "Không tải được danh sách track, vui lòng nhập Track ID đúng theo backend."}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="file">
                      File bài báo (PDF) <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                    <div className="field-hint">
                      Chỉ chấp nhận file PDF, dung lượng theo quy định của hội
                      nghị.
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <label>Đồng tác giả (tùy chọn)</label>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "6px 10px" }}
                        onClick={addCoAuthor}
                      >
                        + Thêm đồng tác giả
                      </button>
                    </div>
                    {coAuthors.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                          marginTop: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Họ tên"
                          value={c.name}
                          onChange={(e) =>
                            handleCoAuthorChange(idx, "name", e.target.value)
                          }
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={c.email}
                          onChange={(e) =>
                            handleCoAuthorChange(idx, "email", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="Đơn vị / Affiliation"
                          value={c.affiliation}
                          onChange={(e) =>
                            handleCoAuthorChange(idx, "affiliation", e.target.value)
                          }
                          style={{ gridColumn: "1 / span 2" }}
                        />
                        <div style={{ gridColumn: "1 / span 2", textAlign: "right" }}>
                          {coAuthors.length > 1 && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "4px 8px" }}
                              onClick={() => removeCoAuthor(idx)}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="field-hint">
                      Bạn có thể bỏ trống nếu không có đồng tác giả. Điền ít nhất tên
                      hoặc email để lưu đồng tác giả.
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/author/submissions")}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : "Nộp bài"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorNewSubmissionPage;
