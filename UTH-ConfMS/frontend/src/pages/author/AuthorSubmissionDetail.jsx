// src/pages/author/AuthorSubmissionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import "../../styles/AuthorPages.css";
import "../../styles/SubmissionDetail.css";

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
    <div className="dash-page modern-detail-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
      <main className="dash-main">
        <section className="dash-section">
          {/* Hero Header with Glassmorphism */}
          <div className="modern-hero-header">
            <div className="hero-background-pattern"></div>
            <div className="hero-content">
              <div className="breadcrumb-modern">
                <button 
                  onClick={() => navigate(-1)} 
                  className="breadcrumb-link-modern"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <span>←</span> Quay lại danh sách
                </button>
              </div>
              
              <div className="hero-title-section">
                <div className="hero-badge-row">
                  <span className="hero-id-badge">#{submission.id}</span>
                  {getStatusBadge(submission.status || submission.reviewStatus)}
                </div>
                <h1 className="hero-title">{submission.title}</h1>
                <div className="hero-meta-tags">
                  <span className="meta-tag conference">
                    {submission.conferenceName || submission.conferenceId}
                  </span>
                  <span className="meta-tag track">
                    {submission.trackName || submission.trackId}
                  </span>
                  <span className="meta-tag date">
                    {formatDate(submission.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="auth-error modern-error">
              {error}
            </div>
          )}

          {/* Modern Timeline Layout */}
          <div className="modern-timeline-container">
            {/* Quick Actions Floating Bar */}
            <div className="floating-actions-bar">
              <div className="actions-bar-content">
                {submission.status === "SUBMITTED" && (
                  <button
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/author/submissions/${submission.id}/edit`)}
                  >
                    Chỉnh sửa
                  </button>
                )}

                {submission.downloadUrl && (
                  <a
                    href={submission.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="action-btn download-btn"
                  >
                    Tải PDF
                  </a>
                )}

                {(submission.status === "ACCEPTED" || submission.status === "REJECTED") && (
                  <button
                    className="action-btn reviews-btn"
                    onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}
                  >
                    Xem Reviews
                  </button>
                )}

                {submission.status === "ACCEPTED" && !submission.cameraReadyPath && !submission.cameraReadyDownloadUrl && (
                  <button
                    className="action-btn camera-btn"
                    onClick={() => navigate(`/author/submissions/${submission.id}/camera-ready`)}
                  >
                    Upload Camera-Ready
                  </button>
                )}

                {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
                  <button
                    className="action-btn withdraw-btn"
                    disabled={withdrawing}
                    onClick={handleWithdraw}
                  >
                    {withdrawing ? "Đang rút..." : "Rút bài"}
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="timeline-content">
              {/* Abstract Section - Bento Style */}
              <div className="timeline-item bento-abstract">
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                  <div className="marker-line"></div>
                </div>
                <div className="timeline-card glass-card">
                  <div className="card-header-modern">
                    <h3>Tóm tắt nghiên cứu</h3>
                  </div>
                  <div className="card-content">
                    <p className="abstract-text">{submission.abstractText || submission.abstract}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid - Bento Style */}
              <div className="timeline-item bento-info-grid">
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                  <div className="marker-line"></div>
                </div>
                <div className="info-bento-grid">
                  {/* Authors Card */}
                  <div className="bento-card authors-bento glass-card">
                    <div className="card-header-modern">
                      <h3>Tác giả</h3>
                    </div>
                    <div className="card-content">
                      <div className="author-modern primary-author">
                        <div className="author-avatar">
                          {(submission.authorName || submission.ownerName || "B")[0].toUpperCase()}
                        </div>
                        <div className="author-info">
                          <div className="author-name-modern">{submission.authorName || submission.ownerName || "Bạn"}</div>
                          <div className="author-role">Tác giả chính</div>
                        </div>
                      </div>
                      {submission.coAuthors && submission.coAuthors.length > 0 && (
                        <div className="coauthors-modern">
                          {submission.coAuthors.map((c, i) => (
                            <div key={i} className="author-modern">
                              <div className="author-avatar secondary">
                                {(c.name || c.fullName || "?")[0].toUpperCase()}
                              </div>
                              <div className="author-info">
                                <div className="author-name-modern">{c.name || c.fullName}</div>
                                {c.email && <div className="author-email-modern">{c.email}</div>}
                                {c.affiliation && <div className="author-affiliation-modern">{c.affiliation}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Keywords Card */}
                  {submission.keywords && (
                    <div className="bento-card keywords-bento glass-card">
                      <div className="card-header-modern">
                        <h3>Từ khóa</h3>
                      </div>
                      <div className="card-content">
                        <div className="keywords-modern">
                          {(submission.keywords || "")
                            .toString()
                            .split(/[;,]+/)
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .slice(0, 10)
                            .map((k, i) => (
                              <span key={i} className="keyword-modern">{k}</span>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Card */}
                  <div className="bento-card stats-bento glass-card">
                    <div className="card-header-modern">
                      <h3>Thông tin</h3>
                    </div>
                    <div className="card-content">
                      <div className="stats-modern">
                        <div className="stat-item-modern">
                          <div className="stat-label-modern">Ngày nộp</div>
                          <div className="stat-value-modern">{formatDate(submission.submittedAt || submission.createdAt)}</div>
                        </div>
                        <div className="stat-item-modern">
                          <div className="stat-label-modern">Cập nhật</div>
                          <div className="stat-value-modern">{formatDate(submission.updatedAt)}</div>
                        </div>
                        <div className="stat-item-modern">
                          <div className="stat-label-modern">Trạng thái</div>
                          <div className="stat-value-modern status-text">{submission.status || submission.reviewStatus}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Section */}
              {decision && (decision.status === "ACCEPTED" || decision.status === "REJECTED") && (
                <div className="timeline-item">
                  <div className="timeline-marker">
                    <div className="marker-dot decision-marker"></div>
                    <div className="marker-line"></div>
                  </div>
                  <div className={`timeline-card decision-modern ${decision.status.toLowerCase()}`}>
                    <div className="decision-icon-modern">
                      {decision.status === "ACCEPTED" ? "✓" : "✗"}
                    </div>
                    <div className="decision-content-modern">
                      <h3 className="decision-title-modern">
                        {decision.status === "ACCEPTED" ? "Chúc mừng! Bài báo được chấp nhận" : "Bài báo chưa được chấp nhận"}
                      </h3>
                      <div className="decision-date-modern">{formatDate(decision.decidedAt)}</div>
                      {decision.comment && (
                        <div className="decision-comment-modern">
                          <div className="comment-label">Nhận xét từ Chair:</div>
                          <p>{decision.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {reviews && reviews.length > 0 && (
                <div className="timeline-item">
                  <div className="timeline-marker">
                    <div className="marker-dot reviews-marker"></div>
                    <div className="marker-line"></div>
                  </div>
                  <div className="timeline-card glass-card">
                    <div className="card-header-modern with-action">
                      <div className="header-left">
                        <h3>Đánh giá từ Reviewers</h3>
                        <span className="reviews-count-badge">{reviews.length}</span>
                      </div>
                      {reviews.length > 2 && (
                        <button
                          className="view-all-btn"
                          onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}
                        >
                          Xem tất cả →
                        </button>
                      )}
                    </div>
                    <div className="card-content">
                      <div className="reviews-modern-grid">
                        {reviews.slice(0, 2).map((r, idx) => (
                          <div key={r.id || idx} className="review-modern-card">
                            <div className="review-modern-header">
                              <span className="review-modern-number">Review #{idx + 1}</span>
                              <span className="review-modern-score">{r.score}<span className="score-max">/10</span></span>
                            </div>
                            {r.commentForAuthor && (
                              <p className="review-modern-comment">{r.commentForAuthor}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* End Timeline Marker */}
              <div className="timeline-end">
                <div className="timeline-marker">
                  <div className="marker-dot end-marker"></div>
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
