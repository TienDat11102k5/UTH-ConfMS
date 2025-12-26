// src/pages/author/AuthorPaperReviews.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

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

        // Load paper details (force reload, bypass all cache)
        console.log("Loading paper:", paperId);
        const paperRes = await apiClient.get(`/submissions/${paperId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: { _t: Date.now() }
        });
        console.log("=== FULL PAPER RESPONSE ===");
        console.log("Full response:", JSON.stringify(paperRes.data, null, 2));
        console.log("Camera ready path:", paperRes.data.cameraReadyPath);
        console.log("Camera ready download URL:", paperRes.data.cameraReadyDownloadUrl);
        console.log("===========================");
        setPaper(paperRes.data);

        // Only load reviews if paper has been reviewed (ACCEPTED or REJECTED)
        if (
          paperRes.data.status === "ACCEPTED" ||
          paperRes.data.status === "REJECTED"
        ) {
          try {
            // Load reviews (use for-author endpoint to hide internal comments)
            const reviewsRes = await apiClient.get(
              `/reviews/paper/${paperId}/for-author`
            );
            setReviews(reviewsRes.data || []);
          } catch (err) {
            // Reviews might not be available yet
          }

          try {
            // Load decision
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
    
    // Reload data when navigating back from camera-ready upload
    const handleFocus = () => {
      if (paperId) loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
    if (score >= 2)
      return <span className="badge badge-success">+{score}</span>;
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <strong>Hội nghị:</strong> {paper.conferenceName || (paper.conferenceId ? `Hội nghị #${paper.conferenceId}` : "N/A")}
          </div>
          <div>
            <strong>Track:</strong> {paper.trackName || "N/A"}
          </div>
          <div>
            <strong>Trạng thái:</strong> {getStatusBadge(paper.status)}
          </div>
          <div>
            <strong>Ngày nộp:</strong> {formatDate(paper.createdAt)}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {paper.status === "SUBMITTED" && (
        <div className="status-message status-message-info">
          <div className="status-message-title">Bài báo đã được nộp thành công</div>
          <p className="status-message-text">
            Bài báo của bạn đang chờ được phân công cho reviewer. Bạn sẽ nhận
            được thông báo khi có kết quả.
          </p>
        </div>
      )}

      {paper.status === "UNDER_REVIEW" && (
        <div className="status-message status-message-warning">
          <div className="status-message-title">Bài báo đang được chấm</div>
          <p className="status-message-text">
            Bài báo của bạn đang được các reviewer chấm điểm. Vui lòng chờ kết
            quả.
          </p>
        </div>
      )}

      {/* Decision */}
      {decision && (
        <div className={`decision-card-full decision-${paper.status.toLowerCase()}`}>
          <div className="decision-card-header">
            <h3>
              {paper.status === "ACCEPTED" ? "Chấp nhận" : "Từ chối"}
            </h3>
          </div>
          <div className="decision-card-body">
            {decision.comment && (
              <div className="decision-comment-full">
                <strong>Nhận xét từ Chair:</strong>
                <p>{decision.comment}</p>
              </div>
            )}
            <div className="decision-date-full">
              Quyết định vào: {formatDateTime(decision.decidedAt)}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="reviews-section">
          <h3 className="reviews-title">Kết quả chấm bài ({reviews.length} reviews)</h3>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={review.id} className="review-card">
                <div className="review-card-header">
                  <h4>Review #{index + 1}</h4>
                  <div className="review-meta">
                    {getScoreBadge(review.score)}
                    <span className="review-confidence">
                      Confidence: {review.confidenceLevel}/5
                    </span>
                  </div>
                </div>

                {review.commentForAuthor && (
                  <div className="review-comment-section">
                    <strong>Nhận xét:</strong>
                    <div className="review-comment-text">
                      {review.commentForAuthor}
                    </div>
                  </div>
                )}

                <div className="review-date">
                  Ngày chấm: {formatDateTime(review.submittedAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Average Score */}
          <div className="average-score-card">
            <strong>Điểm trung bình:</strong>{" "}
            <span className="average-score-value">
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
          <div className="no-reviews-message">
            <p>Chưa có reviews hiển thị.</p>
            <p className="no-reviews-note">
              Reviews có thể được ẩn theo chính sách của hội nghị.
            </p>
          </div>
        )}

      {/* Actions */}
      <div className="detail-actions">
        <Link to="/author/submissions" className="btn-secondary">
          Quay lại danh sách
        </Link>
        
        {paper.status === "ACCEPTED" && (
          <>
            {(!paper.cameraReadyPath && !paper.cameraReadyDownloadUrl) ? (
              <Link
                to={`/author/submissions/${paperId}/camera-ready`}
                className="btn-primary"
              >
                Upload Camera-Ready
              </Link>
            ) : (
              <>
                <span className="camera-ready-badge">
                  Đã nộp Camera-Ready
                </span>
                <a
                  href={
                    paper.cameraReadyDownloadUrl ||
                    (paper.cameraReadyPath
                      ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8080'}/uploads/camera-ready/${paper.cameraReadyPath}`
                      : "#")
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  Tải về bản cuối
                </a>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuthorPaperReviews;
