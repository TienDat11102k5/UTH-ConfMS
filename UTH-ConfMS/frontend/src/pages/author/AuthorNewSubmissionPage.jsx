// src/pages/author/AuthorNewSubmissionPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const AuthorNewSubmissionPage = () => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    title: "",
    abstractText: "",
    keywords: "",
    trackId: "",
  });
  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    setFile(uploaded || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!file) {
      setError("Vui lòng chọn file PDF bài báo để nộp.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("abstractText", formValues.abstractText);
      formData.append("keywords", formValues.keywords);
      formData.append("trackId", formValues.trackId);
      formData.append("file", file);

      // Spring Boot: POST /api/author/submissions (consumes multipart/form-data)
      const res = await apiClient.post("/author/submissions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Nộp bài thành công.");
      // nếu backend trả về submissionId, có thể điều hướng thẳng tới detail
      const newId = res.data?.id;
      setTimeout(() => {
        if (newId) {
          navigate(`/author/submissions/${newId}`);
        } else {
          navigate("/author/submissions");
        }
      }, 800);
    } catch (err) {
      console.error("Error submitting paper", err);
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
                    <div className="field-hint">
                      Tạm thời nhập ID track thực tế theo cấu hình backend (sau
                      này có thể load danh sách track từ API riêng).
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
