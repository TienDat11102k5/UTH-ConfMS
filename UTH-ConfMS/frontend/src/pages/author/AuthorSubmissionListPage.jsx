// src/pages/author/AuthorSubmissionListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const AuthorSubmissionListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confId = searchParams.get("confId");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        // Backend Spring Boot: GET /api/submissions
        const res = await apiClient.get(
          confId ? `/submissions?conferenceId=${confId}` : "/submissions"
        );
        if (!ignore) {
          setSubmissions(Array.isArray(res.data) ? res.data : []);
          setDebugInfo("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading submissions", err);
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Không tải được danh sách bài nộp.";
          setError(msg);
          setDebugInfo(
            `Status: ${status || "unknown"}, URL: ${
              err?.config?.url || "n/a"
            }, detail: ${
              err?.response?.data
                ? JSON.stringify(err.response.data)
                : err?.message || "no message"
            }`
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchSubmissions();
    return () => {
      ignore = true;
    };
  }, [confId]);

  const handleWithdraw = async (id) => {
    if (!id) return;
    const confirm = window.confirm("Bạn chắc chắn muốn rút bài này?");
    if (!confirm) return;
    try {
      setWithdrawingId(id);
      await apiClient.post(`/submissions/${id}/withdraw`);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "WITHDRAWN", reviewStatus: "WITHDRAWN" }
            : s
        )
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/login");
        return;
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Không thể rút bài.";
      setError(msg);
      setDebugInfo(
        `Withdraw failed. Status: ${status || "unknown"}, detail: ${
          err?.response?.data
            ? JSON.stringify(err.response.data)
            : err?.message || "no message"
        }`
      );
    } finally {
      setWithdrawingId(null);
    }
  };

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
                {confId
                  ? `Đang lọc theo hội nghị ID #${confId}`
                  : "Xem danh sách bài nộp, trạng thái review và quyết định."}
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

          {confId && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#fafafa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>Chỉ hiển thị submission của hội nghị ID #{confId}.</div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/author/submissions")}
              >
                Bỏ lọc
              </button>
            </div>
          )}

          {/* Error / loading */}
          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
              {debugInfo ? (
                <div
                  style={{ marginTop: 6, fontSize: "0.9rem", color: "#555" }}
                >
                  {debugInfo}
                </div>
              ) : null}
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn-secondary table-action"
                          onClick={() =>
                            navigate(`/author/submissions/${s.id}`)
                          }
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="btn-secondary table-action"
                          onClick={() =>
                            navigate(`/author/submissions/${s.id}/edit`)
                          }
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-secondary table-action"
                          disabled={withdrawingId === s.id}
                          onClick={() => handleWithdraw(s.id)}
                        >
                          {withdrawingId === s.id ? "Đang rút..." : "Rút bài"}
                        </button>
                      </div>
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
