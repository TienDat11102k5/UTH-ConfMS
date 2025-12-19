// src/pages/author/AuthorPaperReviews.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

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
        console.log("Loading paper:", paperId);
        const paperRes = await apiClient.get(`/submissions/${paperId}`);
        console.log("Paper response:", paperRes.data);
        setPaper(paperRes.data);

        // Only load reviews if paper has been reviewed (ACCEPTED or REJECTED)
        if (
          paperRes.data.status === "ACCEPTED" ||
          paperRes.data.status === "REJECTED"
        ) {
          try {
            // Load reviews (use for-author endpoint to hide internal comments)
            console.log("Loading reviews for paper:", paperId);
            const reviewsRes = await apiClient.get(
              `/reviews/paper/${paperId}/for-author`
            );
            console.log("Reviews response:", reviewsRes.data);
            setReviews(reviewsRes.data || []);
          } catch (err) {
            console.error("Error loading reviews:", err);
            // Reviews might not be available yet
          }

          try {
            // Load decision
            console.log("Loading decision for paper:", paperId);
            const decisionRes = await apiClient.get(
              `/decisions/paper/${paperId}`
            );
            console.log("Decision response:", decisionRes.data);
            setDecision(decisionRes.data);
          } catch (err) {
            console.error("Error loading decision:", err);
            // Decision might not be available yet
          }
        }
      } catch (err) {
        console.error("Error loading paper:", err);
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
  }, [paperId]);

  const getStatusBadge = (status) => {
    const badges = {
      SUBMITTED: { text: "Đã nộp", className: "badge-info" },
      UNDER_REVIEW: { text: "Đang chấm", className: "badge-warning" },
      ACCEPTED: { text: "Chấp nhận", className: "badge-success" },
      REJECTED: { text: "Từ chối", className: "badge-danger" },
      WITHDRAWN: { text: "Đã rút", className: "badge-secondary" },
    };
    const badge = badges[status] || badges.SUBMITTED;
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };

  const getScoreBadge = (score) => {
    if (score >= 2) return <span className="badge badge-success">+{score}</span>;
    if (score >= 0) return <span className="badge badge-info">{score}</span>;
    return <span className="badge badge-danger">{score}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Author" title="Reviews & Decision">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error || !paper) {
    return (
      <DashboardLayout roleLabel="Author" title="Reviews & Decision">
        <div style={{ color: "#d32f2f", padding: "1rem" }}>
          {error || "Không tìm thấy bài báo"}
        </div>
        <Link to="/author/submissions" className="btn-secondary">
          Quay lại danh sách
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Reviews & Decision"
      subtitle="Xem kết quả chấm bài và quyết định"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author/submissions">Bài nộp</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Reviews</span>
          </div>
          <h2 className="data-page-title">{paper.title}</h2>
        </div>
      </div>

      {/* Paper Info */}
      <div
        className="form-card"
        style={{ marginBottom: "2rem", padding: "1.5rem" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <strong>Hội nghị:</strong> {paper.conference?.name || "N/A"}
          </div>
          <div>
            <strong>Track:</strong> {paper.track?.name || "N/A"}
          </div>
          <div>
            <strong>Trạng thái:</strong> {getStatusBadge(paper.status)}
          </div>
          <div>
            <strong>Ngày nộp:</strong>{" "}
            {paper.submittedAt
              ? new Date(paper.submittedAt).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {paper.status === "SUBMITTED" && (
        <div
          style={{
            background: "#e3f2fd",
            border: "1px solid #2196f3",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <strong>📝 Bài báo đã được nộp thành công</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>
            Bài báo của bạn đang chờ được phân công cho reviewer. Bạn sẽ nhận được
            thông báo khi có kết quả.
          </p>
        </div>
      )}

      {paper.status === "UNDER_REVIEW" && (
        <div
          style={{
            background: "#fff3e0",
            border: "1px solid #ff9800",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <strong>⏳ Bài báo đang được chấm</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>
            Bài báo của bạn đang được các reviewer chấm điểm. Vui lòng chờ kết quả.
          </p>
        </div>
      )}

      {/* Decision */}
      {decision && (
        <div
          style={{
            background:
              paper.status === "ACCEPTED" ? "#e8f5e9" : "#ffebee",
            border:
              paper.status === "ACCEPTED"
                ? "1px solid #4caf50"
                : "1px solid #f44336",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {paper.status === "ACCEPTED" ? "✅ Chấp nhận" : "❌ Từ chối"}
          </h3>
          {decision.comment && (
            <div>
              <strong>Nhận xét từ Chair:</strong>
              <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                {decision.comment}
              </p>
            </div>
          )}
          <div style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
            Quyết định vào:{" "}
            {decision.decidedAt
              ? new Date(decision.decidedAt).toLocaleString()
              : "N/A"}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h3>Kết quả chấm bài ({reviews.length} reviews)</h3>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className="form-card"
                style={{ padding: "1.5rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h4 style={{ margin: 0 }}>Review #{index + 1}</h4>
                  <div>
                    {getScoreBadge(review.score)}
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.9em",
                        color: "#666",
                      }}
                    >
                      Confidence: {review.confidenceLevel}/5
                    </span>
                  </div>
                </div>

                {review.commentForAuthor && (
                  <div>
                    <strong>Nhận xét:</strong>
                    <p
                      style={{
                        marginTop: "0.5rem",
                        padding: "1rem",
                        background: "#f5f5f5",
                        borderRadius: "4px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {review.commentForAuthor}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.85em",
                    color: "#666",
                  }}
                >
                  Ngày chấm:{" "}
                  {review.submittedAt
                    ? new Date(review.submittedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            ))}
          </div>

          {/* Average Score */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#f5f5f5",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <strong>Điểm trung bình:</strong>{" "}
            <span style={{ fontSize: "1.5em", fontWeight: "bold" }}>
              {(
                reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* No Reviews Yet */}
      {reviews.length === 0 &&
        (paper.status === "ACCEPTED" || paper.status === "REJECTED") && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#666",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <p>Chưa có reviews hiển thị.</p>
            <p style={{ fontSize: "0.9em" }}>
              Reviews có thể được ẩn theo chính sách của hội nghị.
            </p>
          </div>
        )}

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link to="/author/submissions" className="btn-secondary">
          Quay lại danh sách
        </Link>
        {paper.status === "ACCEPTED" && (
          <Link
            to={`/author/submissions/${paperId}/camera-ready`}
            className="btn-primary"
          >
            Upload Camera-Ready
          </Link>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuthorPaperReviews;
