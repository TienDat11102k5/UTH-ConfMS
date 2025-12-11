// src/pages/author/AuthorSubmissionFormPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const AuthorSubmissionFormPage = () => {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    trackId: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: gọi API backend /api/author/submissions với form + file
    console.log("Submit form (todo call API):", form);
    alert("Form nộp bài mới (frontend) đã submit. Cần nối API backend sau.");
  };

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Nộp bài mới"
      subtitle="Nhập thông tin bài báo và tải lên file PDF theo hướng dẫn của hội nghị."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author" className="breadcrumb-link">
              Author Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/author/submissions" className="breadcrumb-link">
              Submissions
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Nộp bài mới</span>
          </div>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Tiêu đề bài báo *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Ví dụ: A Study on Smart Transportation at UTH"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="trackId">Track / Chủ đề *</label>
              <select
                id="trackId"
                name="trackId"
                value={form.trackId}
                onChange={handleChange}
                required
                className="select-input"
              >
                <option value="">-- Chọn track --</option>
                {/* Sau này load options thật từ API /api/public/tracks */}
                <option value="track-1">Ví dụ: Smart Systems &amp; IoT</option>
                <option value="track-2">Ví dụ: Data Science &amp; AI</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="abstract">Tóm tắt (abstract) *</label>
            <textarea
              id="abstract"
              name="abstract"
              rows={5}
              placeholder="Nhập tóm tắt 150–250 từ theo yêu cầu của hội nghị..."
              value={form.abstract}
              onChange={handleChange}
              required
              className="textarea-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="keywords">Từ khóa (keywords) *</label>
            <input
              id="keywords"
              name="keywords"
              type="text"
              placeholder="Ví dụ: smart city; transportation; machine learning"
              value={form.keywords}
              onChange={handleChange}
              required
            />
            <div className="field-hint">
              Nhập 3–6 từ khóa, ngăn cách bằng dấu chấm phẩy (;).
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="file">File PDF *</label>
            <input
              id="file"
              name="file"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
              required
            />
            <div className="field-hint">
              Chỉ chấp nhận PDF theo template của hội nghị. Không nhúng thông tin
              tác giả nếu double-blind review được bật.
            </div>
          </div>

          <div className="form-actions">
            <Link to="/author/submissions" className="btn-secondary">
              Hủy &amp; quay lại danh sách
            </Link>
            <button type="submit" className="btn-primary">
              Gửi submission
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AuthorSubmissionFormPage;
