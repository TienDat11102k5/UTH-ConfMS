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
      {/* Header */}
      <div className="reviews-page-header">
        <div className="breadcrumb">
          <Link to="/author/dashboard">Portal</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/author/submissions">Bài nộp</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Reviews</span>
        </div>
        <h1 className="reviews-page-title">{paper.title}</h1>
        <div className="reviews-meta-row">
          <span className="reviews-meta-item">
            <strong>Hội nghị:</strong> {paper.conferenceName || "N/A"}
          </span>
          <span className="reviews-meta-item">
            <strong>CHỦ ĐỀ:</strong> {paper.trackName || "N/A"}
          </span>
          <span className="reviews-meta-item">
            <strong>Ngày nộp:</strong> {formatDate(paper.createdAt)}
          </span>
          {getStatusBadge(paper.status)}
        </div>
      </div>

      {/* Status Messages */}
      {paper.status === "SUBMITTED" && (
        <div className="status-message status-submitted">
          <div className="status-message-title">Bài báo đã được nộp thành công</div>
          <p>
            Bài báo của bạn đang chờ được phân công cho reviewer. Bạn sẽ nhận
            được thông báo khi có kết quả.
          </p>
        </div>
      )}

      {paper.status === "UNDER_REVIEW" && (
        <div className="status-message status-under-review">
          <div className="status-message-title">Bài báo đang được chấm</div>
          <p>
            Bài báo của bạn đang được các reviewer chấm điểm. Vui lòng chờ kết
            quả.
          </p>
        </div>
      )}

      {/* Decision Card */}
      {decision && (
        <div className={`decision-card ${paper.status === "ACCEPTED" ? "decision-accepted" : "decision-rejected"}`}>
          <div className="decision-header">
            <h2 className="decision-title">
              {paper.status === "ACCEPTED" ? "Chấp nhận" : "Từ chối"}
            </h2>
            <div className="decision-date">
              {formatDateTime(decision.decidedAt)}
            </div>
          </div>
          {decision.comment && (
            <div className="decision-body">
              <div className="decision-label">Nhận xét từ Chair:</div>
              <div className="decision-comment">{decision.comment}</div>
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="reviews-section">
          <div className="reviews-section-header">
            <h2>Kết quả chấm bài</h2>
            <span className="reviews-count">{reviews.length} reviews</span>
          </div>

          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div key={review.id} className="review-card">
                <div className="review-card-header">
                  <div className="review-number">Review {index + 1}</div>
                  <div className="review-scores">
                    <div className="review-score-badge">
                      Điểm: <strong>{review.score}</strong>
                    </div>
                    <div className="review-confidence">
                      Confidence: {review.confidenceLevel}/5
                    </div>
                  </div>
                </div>

                {review.commentForAuthor && (
                  <div className="review-card-body">
                    <div className="review-label">Nhận xét:</div>
                    <div className="review-comment">{review.commentForAuthor}</div>
                  </div>
                )}

                <div className="review-card-footer">
                  Ngày chấm: {formatDateTime(review.submittedAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Average Score */}
          <div className="average-score-card">
            <div className="average-score-label">Điểm trung bình</div>
            <div className="average-score-value">
              {(reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* No Reviews Yet */}
      {reviews.length === 0 &&
        (paper.status === "ACCEPTED" || paper.status === "REJECTED") && (
          <div className="empty-reviews">
            <div className="empty-reviews-title">Chưa có reviews hiển thị</div>
            <div className="empty-reviews-text">
              Reviews có thể được ẩn theo chính sách của hội nghị.
            </div>
          </div>
        )}

      {/* Camera-Ready Section */}
      {paper.status === "ACCEPTED" && (
        <div className="camera-ready-section">
          <h2 className="camera-ready-title">Camera-Ready Submission</h2>
          {(!paper.cameraReadyPath && !paper.cameraReadyDownloadUrl) ? (
            <div className="camera-ready-pending">
              <div className="camera-ready-pending-text">
                Bài báo của bạn đã được chấp nhận. Vui lòng nộp bản camera-ready để hoàn tất quá trình.
              </div>
              <Link
                to={`/author/submissions/${paperId}/camera-ready`}
                className="btn-primary"
              >
                Upload Camera-Ready
              </Link>
            </div>
          ) : (
            <div className="camera-ready-submitted">
              <div className="camera-ready-status">
                <span className="camera-ready-status-text">Đã nộp Camera-Ready</span>
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
              >
                Tải về
              </a>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="reviews-actions">
        <Link to="/author/submissions" className="btn-secondary">
          Quay lại danh sách
        </Link>
        <Link to={`/author/submissions/${paperId}`} className="btn-outline">
          Xem chi tiết bài nộp
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default AuthorPaperReviews;
