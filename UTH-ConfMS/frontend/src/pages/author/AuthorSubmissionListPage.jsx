// src/pages/author/AuthorSubmissionListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const AuthorSubmissionListPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        // Backend Spring Boot: GET /api/author/submissions
        const res = await apiClient.get("/author/submissions");
        if (!ignore) {
          setSubmissions(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading submissions", err);
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Không tải được danh sách bài nộp.";
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchSubmissions();
    return () => {
      ignore = true;
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />

      <main className="dash-main">
        <section className="dash-section">
          {/* Header list */}
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">
                  Portal
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Author submissions</span>
              </div>
              <h1 className="data-page-title">Bài nộp của tôi</h1>
              <p className="data-page-subtitle">
                Xem danh sách bài nộp, trạng thái review và quyết định.
              </p>
            </div>
            <div className="data-page-header-right">
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/author/submissions/new")}
              >
                + Nộp bài mới
              </button>
            </div>
          </div>

          {/* Error / loading */}
          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          {loading && (
            <div style={{ marginBottom: "1rem", color: "#525252" }}>
              Đang tải dữ liệu...
            </div>
          )}

          {/* Bảng dữ liệu */}
          <div className="table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tiêu đề</th>
                  <th>Track</th>
                  <th>Trạng thái</th>
                  <th>Ngày nộp</th>
                  <th>Ngày cập nhật</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!loading && submissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      Chưa có bài nộp nào. Hãy bấm{" "}
                      <strong>“Nộp bài mới”</strong> để tạo submission đầu tiên.
                    </td>
                  </tr>
                )}

                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.title}</td>
                    <td>{s.trackName || s.trackCode || s.trackId}</td>
                    <td>{s.status || s.reviewStatus}</td>
                    <td>{formatDate(s.submittedAt || s.createdAt)}</td>
                    <td>{formatDate(s.updatedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary table-action"
                        onClick={() => navigate(`/author/submissions/${s.id}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorSubmissionListPage;
