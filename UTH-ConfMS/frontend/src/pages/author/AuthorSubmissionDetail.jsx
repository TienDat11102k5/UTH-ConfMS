// src/pages/author/AuthorSubmissionDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { formatDateTime } from "../../utils/dateUtils";

const formatDate = (value) => {
  if (!value) return "";
  try {
    // Use formatDateTime from dateUtils.js for UTC+7 consistency
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return "";
    
    // Add 7 hours for Vietnam timezone
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const day = String(vietnamDate.getDate()).padStart(2, '0');
    const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
    const year = vietnamDate.getFullYear();
    const hour = String(vietnamDate.getHours()).padStart(2, '0');
    const minute = String(vietnamDate.getMinutes()).padStart(2, '0');
    const second = String(vietnamDate.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  } catch {
    return value;
  }
};

const AuthorSubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [decision, setDecision] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get(`/submissions/${id}`);
        if (!ignore) {
          setSubmission(res.data || null);

          // Load reviews
          try {
            const rev = await apiClient.get(`/reviews/paper/${id}/for-author`);
            if (!ignore) setReviews(Array.isArray(rev.data) ? rev.data : []);
          } catch (e) {
            // ignore
          }

          // Load decision
          try {
            const dec = await apiClient.get(`/decisions/paper/${id}`);
            if (!ignore) setDecision(dec.data || null);
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        if (!ignore) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          setError(err?.response?.data?.message || err?.message || "Không thể tải submission.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (id) load();
    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  const handleWithdraw = async () => {
    if (!submission?.id) return;
    if (!window.confirm("Bạn chắc chắn muốn rút bài này?")) return;
    try {
      setWithdrawing(true);
      await apiClient.post(`/submissions/${submission.id}/withdraw`);
      setSubmission((s) => ({ ...s, status: "WITHDRAWN", reviewStatus: "WITHDRAWN" }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/login");
        return;
      }
      setError(err?.response?.data?.message || err?.message || "Rút bài thất bại.");
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: "Đã nộp", color: "#3b82f6" },
      UNDER_REVIEW: { label: "Đang review", color: "#f59e0b" },
      ACCEPTED: { label: "Chấp nhận", color: "#10b981" },
      REJECTED: { label: "Từ chối", color: "#ef4444" },
      WITHDRAWN: { label: "Đã rút", color: "#6b7280" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#6b7280" };
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.375rem 0.75rem",
        borderRadius: "6px",
        fontSize: "0.875rem",
        fontWeight: 600,
        background: `${statusInfo.color}15`,
        color: statusInfo.color,
        border: `1px solid ${statusInfo.color}30`
      }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Author" title="Chi tiết bài báo">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error || !submission) {
    return (
      <DashboardLayout roleLabel="Author" title="Chi tiết bài báo">
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        }}>
          <h3 style={{ marginBottom: "0.5rem", color: "#1f2937" }}>Không thể tải submission</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{error || "Không tìm thấy submission."}</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Chi tiết bài báo"
      subtitle="Xem thông tin chi tiết, trạng thái và đánh giá của bài báo"
    >
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn-back"
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          ← Quay lại
        </button>
      </div>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <h2 className="data-page-title" style={{ marginTop: "0.5rem" }}>
            {submission.title}
          </h2>
          <div style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            marginTop: "0.75rem",
            flexWrap: "wrap"
          }}>
            {getStatusBadge(submission.status || submission.reviewStatus)}
            <span style={{
              padding: "0.25rem 0.625rem",
              background: "#e0f2f1",
              color: "#00695c",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 600
            }}>
              {submission.trackName || submission.trackId}
            </span>
          </div>
        </div>
        <div className="data-page-header-right" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {submission.status === "SUBMITTED" && (
            <button
              className="btn-secondary"
              onClick={() => navigate(`/author/submissions/${submission.id}/edit`)}
            >
              Chỉnh sửa
            </button>
          )}

          {submission.status === "ACCEPTED" && !submission.cameraReadyPath && !submission.cameraReadyDownloadUrl && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/author/submissions/${submission.id}/camera-ready`)}
            >
              Upload Camera-Ready
            </button>
          )}

          {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
            <button
              className="btn-secondary"
              style={{ color: "#ef4444", borderColor: "#ef4444" }}
              disabled={withdrawing}
              onClick={handleWithdraw}
            >
              {withdrawing ? "Đang rút..." : "Rút bài"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      {/* Decision Alert */}
      {decision && (decision.status === "ACCEPTED" || decision.status === "REJECTED") && (
        <div style={{
          background: decision.status === "ACCEPTED" ? "#ecfdf5" : "#fef2f2",
          border: `2px solid ${decision.status === "ACCEPTED" ? "#10b981" : "#ef4444"}`,
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: "0 0 0.5rem 0",
                color: decision.status === "ACCEPTED" ? "#065f46" : "#991b1b",
                fontSize: "1.125rem",
                fontWeight: 700
              }}>
                {decision.status === "ACCEPTED" ? "🎉 Chúc mừng! Bài báo được chấp nhận" : "Bài báo chưa được chấp nhận"}
              </h3>
              <div style={{
                fontSize: "0.875rem",
                color: decision.status === "ACCEPTED" ? "#047857" : "#b91c1c",
                marginBottom: "0.75rem"
              }}>
                {formatDate(decision.decidedAt)}
              </div>
              {decision.comment && (
                <div style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "#374151",
                    fontSize: "0.875rem"
                  }}>
                    Nhận xét từ Chair:
                  </div>
                  <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6 }}>{decision.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* File Downloads */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{
            marginBottom: "1rem",
            fontWeight: 600,
            color: "#64748b",
            fontSize: "0.875rem",
          }}>
            Tệp đính kèm
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {submission.downloadUrl && (
              <div style={{
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                    Bản thảo gốc (để chấm)
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                    File PDF đã nộp lúc submit
                  </div>
                </div>
                <a
                  href={submission.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Tải PDF
                </a>
              </div>
            )}

            {(submission.cameraReadyDownloadUrl || submission.cameraReadyPath) && (
              <div style={{
                padding: "1rem",
                background: "#f0fdf4",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                    Bản Camera-Ready (bản cuối)
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>
                    File PDF đã được chỉnh sửa sau khi chấp nhận
                  </div>
                </div>
                <a
                  href={submission.cameraReadyDownloadUrl || submission.cameraReadyPath}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Tải PDF
                </a>
              </div>
            )}

            {!submission.downloadUrl && !submission.cameraReadyDownloadUrl && !submission.cameraReadyPath && (
              <div style={{
                padding: "1rem",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}>
                Chưa có file đính kèm
              </div>
            )}
          </div>
        </div>

        {/* Abstract */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{
            marginBottom: "1rem",
            fontWeight: 600,
            color: "#64748b",
            fontSize: "0.875rem",
          }}>
            Tóm tắt nghiên cứu
          </div>
          <p style={{
            margin: 0,
            color: "#374151",
            lineHeight: 1.7,
            fontSize: "0.9375rem"
          }}>
            {submission.abstractText || submission.abstract}
          </p>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {/* Authors */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{
              marginBottom: "1rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              Tác giả
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                  {submission.authorName || submission.ownerName || "Bạn"}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#0d9488", fontWeight: 600 }}>
                  Tác giả chính
                </div>
              </div>
              {submission.coAuthors && submission.coAuthors.length > 0 && (
                <>
                  {submission.coAuthors.map((c, i) => (
                    <div key={i} style={{
                      padding: "0.75rem",
                      background: "#fafbfc",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{ fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                        {c.name || c.fullName}
                      </div>
                      {c.email && (
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                          {c.email}
                        </div>
                      )}
                      {c.affiliation && (
                        <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "0.125rem" }}>
                          {c.affiliation}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Keywords & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Keywords */}
            {submission.keywords && (
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{
                  marginBottom: "1rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}>
                  Từ khóa
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(submission.keywords || "")
                    .toString()
                    .split(/[;,]+/)
                    .map((k) => k.trim())
                    .filter(Boolean)
                    .slice(0, 10)
                    .map((k, i) => (
                      <span key={i} style={{
                        padding: "0.375rem 0.75rem",
                        background: "#f0fdfa",
                        color: "#0d9488",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        border: "1px solid #ccfbf1"
                      }}>
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{
                marginBottom: "1rem",
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                Thông tin
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    Hội nghị
                  </div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>
                    {submission.conferenceName || submission.conferenceId}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    Ngày nộp
                  </div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>
                    {formatDate(submission.submittedAt || submission.createdAt)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    Cập nhật lần cuối
                  </div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>
                    {formatDate(submission.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                Đánh giá từ Reviewers
                <span style={{
                  padding: "0.125rem 0.5rem",
                  background: "#f1f5f9",
                  color: "#475569",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 700
                }}>
                  {reviews.length}
                </span>
              </div>
              {reviews.length > 2 && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
                  onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}
                >
                  Xem tất cả →
                </button>
              )}
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              {reviews.slice(0, 2).map((r, idx) => (
                <div key={r.id || idx} style={{
                  padding: "1rem",
                  background: "#fafbfc",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem"
                  }}>
                    <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.875rem" }}>
                      Review #{idx + 1}
                    </span>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: 700
                    }}>
                      {r.score}/10
                    </span>
                  </div>
                  {r.commentForAuthor && (
                    <p style={{
                      margin: 0,
                      color: "#6b7280",
                      lineHeight: 1.6,
                      fontSize: "0.875rem"
                    }}>
                      {r.commentForAuthor}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back Button at Bottom */}
      <div style={{
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center"
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.transform = "translateX(-4px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.transform = "translateX(0)";
          }}
          style={{
            transition: "all 0.2s ease"
          }}
        >
          ← Quay lại danh sách
        </button>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: "3rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "0.875rem"
      }}>
        © {new Date().getFullYear()} Hệ thống quản lý hội nghị khoa học - Trường Đại học Giao thông Vận tải
      </footer>
    </DashboardLayout>
  );
};

export default AuthorSubmissionDetail;
