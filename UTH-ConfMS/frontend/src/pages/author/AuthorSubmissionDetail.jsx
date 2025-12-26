// src/pages/author/AuthorSubmissionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import "../../styles/AuthorPages.css";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN");
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
      SUBMITTED: { class: "submitted", label: "Đã nộp" },
      UNDER_REVIEW: { class: "under-review", label: "Đang review" },
      ACCEPTED: { class: "accepted", label: "Chấp nhận" },
      REJECTED: { class: "rejected", label: "Từ chối" },
      WITHDRAWN: { class: "withdrawn", label: "Đã rút" },
    };
    const statusInfo = statusMap[status] || { class: "submitted", label: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải chi tiết submission...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <div className="error-state">
            <h3>Không thể tải submission</h3>
            <p>{error || "Không tìm thấy submission."}</p>
            <div className="error-actions">
              <button className="btn-secondary" onClick={() => navigate(-1)}>
                Quay lại
              </button>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Thử lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
      <main className="dash-main">
        <section className="dash-section">
          {/* Header */}
          <div className="detail-header">
            <div className="breadcrumb">
              <Link to="/author/submissions" className="breadcrumb-link">
                Bài nộp
              </Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">#{submission.id}</span>
            </div>
            
            <div className="detail-title-row">
              <h1 className="detail-title">{submission.title}</h1>
              {getStatusBadge(submission.status || submission.reviewStatus)}
            </div>
            
            <div className="detail-meta-row">
              <span>Hội nghị: <strong>{submission.conferenceName || submission.conferenceId}</strong></span>
              <span>•</span>
              <span>Chủ đề: <strong>{submission.trackName || submission.trackId}</strong></span>
              <span>•</span>
              <span>Cập nhật: {formatDate(submission.updatedAt)}</span>
            </div>
          </div>

          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="detail-grid">
            {/* Left Column - Main Content */}
            <div className="detail-main">
              {/* Abstract */}
              <div className="detail-card">
                <h3 className="detail-card-title">Tóm tắt (Abstract)</h3>
                <p className="detail-abstract">{submission.abstractText || submission.abstract}</p>
              </div>

              {/* File Download */}
              {submission.downloadUrl && (
                <div className="detail-card">
                  <h3 className="detail-card-title">File bài báo</h3>
                  <a
                    href={submission.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    Tải xuống PDF
                  </a>
                </div>
              )}

              {/* Decision */}
              {decision && (decision.status === "ACCEPTED" || decision.status === "REJECTED") && (
                <div className={`decision-card ${decision.status.toLowerCase()}`}>
                  <div className="decision-header">
                    <h3>{decision.status === "ACCEPTED" ? "Bài báo được chấp nhận" : "Bài báo bị từ chối"}</h3>
                    <span className="decision-date">{formatDate(decision.decidedAt)}</span>
                  </div>
                  {decision.comment && (
                    <div className="decision-comment">
                      <strong>Nhận xét từ Chair:</strong>
                      <p>{decision.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Preview */}
              {reviews && reviews.length > 0 && (
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3 className="detail-card-title">Kết quả đánh giá ({reviews.length})</h3>
                    {reviews.length > 2 && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}
                      >
                        Xem tất cả
                      </button>
                    )}
                  </div>
                  <div className="reviews-preview">
                    {reviews.slice(0, 2).map((r, idx) => (
                      <div key={r.id || idx} className="review-preview-card">
                        <div className="review-preview-header">
                          <span className="review-number">Review #{idx + 1}</span>
                          <span className="review-score">Điểm: {r.score}/10</span>
                        </div>
                        {r.commentForAuthor && (
                          <p className="review-comment">{r.commentForAuthor}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="detail-sidebar">
              {/* Info Card */}
              <div className="sidebar-card">
                <h4 className="sidebar-card-title">Thông tin</h4>
                <div className="sidebar-info">
                  <div className="info-row">
                    <span className="info-label">Mã bài:</span>
                    <span className="info-value">#{submission.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-value">{submission.status || submission.reviewStatus}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ngày nộp:</span>
                    <span className="info-value">{formatDate(submission.submittedAt || submission.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cập nhật:</span>
                    <span className="info-value">{formatDate(submission.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Authors Card */}
              <div className="sidebar-card">
                <h4 className="sidebar-card-title">Tác giả</h4>
                <div className="authors-list">
                  <div className="author-item primary">
                    <strong>{submission.authorName || submission.ownerName || "Bạn"}</strong>
                    <span className="author-badge">Tác giả chính</span>
                  </div>
                  {submission.coAuthors && submission.coAuthors.length > 0 && (
                    <>
                      <div className="authors-divider"></div>
                      {submission.coAuthors.map((c, i) => (
                        <div key={i} className="author-item">
                          <div className="author-name">{c.name || c.fullName}</div>
                          {c.email && <div className="author-email">{c.email}</div>}
                          {c.affiliation && <div className="author-affiliation">{c.affiliation}</div>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Keywords Card */}
              {submission.keywords && (
                <div className="sidebar-card">
                  <h4 className="sidebar-card-title">Từ khóa</h4>
                  <div className="keywords-list">
                    {(submission.keywords || "")
                      .toString()
                      .split(/[;,]+/)
                      .map((k) => k.trim())
                      .filter(Boolean)
                      .slice(0, 10)
                      .map((k, i) => (
                        <span key={i} className="keyword-tag">{k}</span>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions Card */}
              <div className="sidebar-card actions-card">
                <h4 className="sidebar-card-title">Hành động</h4>
                <div className="sidebar-actions">
                  {submission.status === "SUBMITTED" && (
                    <button
                      className="btn-secondary btn-block"
                      onClick={() => navigate(`/author/submissions/${submission.id}/edit`)}
                    >
                      Chỉnh sửa
                    </button>
                  )}

                  {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
                    <button
                      className="btn-secondary btn-block btn-danger"
                      disabled={withdrawing}
                      onClick={handleWithdraw}
                    >
                      {withdrawing ? "Đang rút..." : "Rút bài"}
                    </button>
                  )}

                  {(submission.status === "ACCEPTED" || submission.status === "REJECTED") && (
                    <button
                      className="btn-primary btn-block"
                      onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}
                    >
                      Xem Reviews đầy đủ
                    </button>
                  )}

                  {submission.status === "ACCEPTED" && !submission.cameraReadyPath && !submission.cameraReadyDownloadUrl && (
                    <button
                      className="btn-primary btn-block"
                      onClick={() => navigate(`/author/submissions/${submission.id}/camera-ready`)}
                    >
                      Upload Camera-Ready
                    </button>
                  )}

                  {submission.status === "ACCEPTED" && (submission.cameraReadyPath || submission.cameraReadyDownloadUrl) && (
                    <a
                      href={
                        submission.cameraReadyDownloadUrl ||
                        (submission.cameraReadyPath ? `/uploads/camera-ready/${submission.cameraReadyPath}` : "#")
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-block"
                    >
                      Tải Camera-Ready
                    </a>
                  )}

                  <button className="btn-secondary btn-block" onClick={() => navigate(-1)}>
                    Quay lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorSubmissionDetail;
