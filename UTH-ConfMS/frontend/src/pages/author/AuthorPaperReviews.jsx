// src/pages/author/AuthorPaperReviews.jsx
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
    return `${day}/${month}/${year}`;
  } catch {
    return value;
  }
};

const formatDateTimeLocal = (value) => {
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

const AuthorPaperReviews = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Load paper details
        const paperRes = await apiClient.get(`/submissions/${paperId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: { _t: Date.now() }
        });
        setPaper(paperRes.data);

        // Only load reviews if paper has been reviewed
        if (
          paperRes.data.status === "ACCEPTED" ||
          paperRes.data.status === "REJECTED"
        ) {
          try {
            const reviewsRes = await apiClient.get(
              `/reviews/paper/${paperId}/for-author`
            );
            setReviews(reviewsRes.data || []);
          } catch (err) {
            // Reviews might not be available yet
          }

          try {
            const decisionRes = await apiClient.get(
              `/decisions/paper/${paperId}`
            );
            setDecision(decisionRes.data);
          } catch (err) {
            // Decision might not be available yet
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Không thể tải thông tin bài báo"
        );
      } finally {
        setLoading(false);
      }
    };

    if (paperId) loadData();

    const handleFocus = () => {
      if (paperId) loadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [paperId]);

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: "Đã nộp", color: "#3b82f6" },
      UNDER_REVIEW: { label: "Đang chấm", color: "#f59e0b" },
      ACCEPTED: { label: "Chấp nhận", color: "#10b981" },
      REJECTED: { label: "Từ chối", color: "#ef4444" },
      WITHDRAWN: { label: "Đã rút", color: "#6b7280" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#6b7280" };
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
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
      <DashboardLayout roleLabel="Author" title="Kết quả chấm bài">
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
          >
            ← Quay lại
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error || !paper) {
    return (
      <DashboardLayout roleLabel="Author" title="Kết quả chấm bài">
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
          >
            ← Quay lại
          </button>
        </div>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        }}>
          <h3 style={{ marginBottom: "0.5rem", color: "#1f2937" }}>Không thể tải thông tin</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{error || "Không tìm thấy bài báo"}</p>
          <button className="btn-secondary" onClick={() => navigate("/author/submissions")}>
            ← Quay lại danh sách
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const averageScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(2)
    : 0;

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Kết quả chấm bài"
      subtitle="Xem đánh giá từ reviewers và quyết định từ Chair"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <h2 className="data-page-title" style={{ marginTop: "0.5rem" }}>
            {paper.title}
          </h2>
          <div style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            marginTop: "0.75rem",
            flexWrap: "wrap"
          }}>
            {getStatusBadge(paper.status)}
            <span style={{
              padding: "0.25rem 0.625rem",
              background: "#e0f2f1",
              color: "#00695c",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 600
            }}>
              {paper.trackName || paper.trackId}
            </span>
            <span style={{
              padding: "0.25rem 0.625rem",
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: 600
            }}>
              Nộp: {formatDate(paper.createdAt)}
            </span>
          </div>
        </div>
        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            onClick={() => navigate(`/author/submissions/${paperId}`)}
          >
            Xem chi tiết bài nộp
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {paper.status === "SUBMITTED" && (
        <div style={{
          background: "#dbeafe",
          border: "1px solid #93c5fd",
          padding: "1.25rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: "0.5rem", fontSize: "1rem" }}>
            Bài báo đã được nộp thành công
          </div>
          <p style={{ margin: 0, color: "#1e3a8a", lineHeight: 1.6 }}>
            Bài báo của bạn đang chờ được phân công cho reviewer. Bạn sẽ nhận được thông báo khi có kết quả.
          </p>
        </div>
      )}

      {paper.status === "UNDER_REVIEW" && (
        <div style={{
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          padding: "1.25rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.5rem", fontSize: "1rem" }}>
            Bài báo đang được chấm
          </div>
          <p style={{ margin: 0, color: "#78350f", lineHeight: 1.6 }}>
            Bài báo của bạn đang được các reviewer chấm điểm. Vui lòng chờ kết quả.
          </p>
        </div>
      )}

      {/* Decision Card */}
      {decision && (
        <div style={{
          background: paper.status === "ACCEPTED" ? "#ecfdf5" : "#fef2f2",
          border: `2px solid ${paper.status === "ACCEPTED" ? "#10b981" : "#ef4444"}`,
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{
              margin: "0 0 0.5rem 0",
              color: paper.status === "ACCEPTED" ? "#065f46" : "#991b1b",
              fontSize: "1.25rem",
              fontWeight: 700
            }}>
              {paper.status === "ACCEPTED" ? "🎉 Chúc mừng! Bài báo được chấp nhận" : "Bài báo chưa được chấp nhận"}
            </h3>
            <div style={{
              fontSize: "0.875rem",
              color: paper.status === "ACCEPTED" ? "#047857" : "#b91c1c",
            }}>
              Quyết định ngày: {formatDateTimeLocal(decision.decidedAt)}
            </div>
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
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e5e7eb",
            marginBottom: "1rem"
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
                gap: "0.75rem",
                fontWeight: 600,
                color: "#1f2937",
                fontSize: "1.125rem",
              }}>
                Kết quả chấm bài
                <span style={{
                  padding: "0.25rem 0.625rem",
                  background: "#f1f5f9",
                  color: "#475569",
                  borderRadius: "12px",
                  fontSize: "0.875rem",
                  fontWeight: 700
                }}>
                  {reviews.length} đánh giá
                </span>
              </div>
              <div style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                color: "white",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "1.125rem"
              }}>
                Điểm TB: {averageScore}/10
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {reviews.map((review, index) => (
              <div key={review.id} style={{
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
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid #e5e7eb"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "1rem", marginBottom: "0.25rem" }}>
                      Đánh giá #{index + 1}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                      Ngày chấm: {formatDateTimeLocal(review.submittedAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{
                      padding: "0.5rem 1rem",
                      background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                      color: "white",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "1.125rem"
                    }}>
                      {review.score}/10
                    </div>
                    <div style={{
                      padding: "0.375rem 0.75rem",
                      background: "#f1f5f9",
                      color: "#475569",
                      borderRadius: "6px",
                      fontSize: "0.8125rem",
                      fontWeight: 600
                    }}>
                      Độ tin cậy: {review.confidenceLevel}/5
                    </div>
                  </div>
                </div>

                {review.commentForAuthor && (
                  <div>
                    <div style={{
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: "#64748b",
                      fontSize: "0.875rem"
                    }}>
                      Nhận xét:
                    </div>
                    <p style={{
                      margin: 0,
                      color: "#374151",
                      lineHeight: 1.7,
                      fontSize: "0.9375rem",
                      whiteSpace: "pre-wrap"
                    }}>
                      {review.commentForAuthor}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews Yet */}
      {reviews.length === 0 &&
        (paper.status === "ACCEPTED" || paper.status === "REJECTED") && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            marginBottom: "1.5rem"
          }}>
            <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
              Chưa có đánh giá hiển thị
            </div>
            <div style={{ color: "#6b7280" }}>
              Đánh giá có thể được ẩn theo chính sách của hội nghị.
            </div>
          </div>
        )}

      {/* Camera-Ready Section */}
      {paper.status === "ACCEPTED" && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            marginBottom: "1rem",
            fontWeight: 600,
            color: "#64748b",
            fontSize: "0.875rem",
          }}>
            Nộp bản cuối
          </div>
          {(!paper.cameraReadyPath && !paper.cameraReadyDownloadUrl) ? (
            <div>
              <div style={{
                padding: "1rem",
                background: "#fef3c7",
                borderRadius: "8px",
                marginBottom: "1rem",
                color: "#78350f",
                lineHeight: 1.6
              }}>
                Bài báo của bạn đã được chấp nhận. Vui lòng nộp bản cuối để hoàn tất quá trình.
              </div>
              <button
                className="btn-primary"
                onClick={() => navigate(`/author/submissions/${paperId}/camera-ready`)}
              >
                Tải lên bản cuối
              </button>
            </div>
          ) : (
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
                <div style={{ fontWeight: 600, color: "#15803d", marginBottom: "0.25rem" }}>
                  ✓ Đã nộp bản cuối
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#166534" }}>
                  File đã được tải lên thành công
                </div>
              </div>
              <a
                href={
                  paper.cameraReadyDownloadUrl ||
                  (paper.cameraReadyPath
                    ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8080'}/uploads/camera-ready/${paper.cameraReadyPath}`
                    : "#")
                }
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Tải về
              </a>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div style={{
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center"
      }}>
        <button
          onClick={() => navigate("/author/submissions")}
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

export default AuthorPaperReviews;
