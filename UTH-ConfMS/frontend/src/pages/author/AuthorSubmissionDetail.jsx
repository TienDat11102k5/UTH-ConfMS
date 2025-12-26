// src/pages/author/AuthorSubmissionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
};

const getStatusClass = (status) => {
  if (!status) return "secondary";
  const s = status.toUpperCase();
  if (s === "ACCEPTED") return "success";
  if (s === "REJECTED") return "danger";
  if (s === "UNDER_REVIEW") return "info";
  if (s === "WITHDRAWN") return "warning";
  return "secondary";
};

const AuthorSubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [submission, setSubmission] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [decision, setDecision] = useState(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
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
          // attempt to load reviews/decision (best-effort)
          (async () => {
            try {
              setLoadingExtras(true);
              const rev = await apiClient.get(
                `/reviews/paper/${id}/for-author`
              );
              if (!ignore) setReviews(Array.isArray(rev.data) ? rev.data : []);
            } catch (e) {
              // ignore
            }
            try {
              const dec = await apiClient.get(`/decisions/paper/${id}`);
              if (!ignore) setDecision(dec.data || null);
            } catch (e) {
              // ignore
            } finally {
              if (!ignore) setLoadingExtras(false);
            }
          })();
        }
      } catch (err) {
        if (!ignore) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải submission.";
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
      setSubmission((s) => ({
        ...s,
        status: "WITHDRAWN",
        reviewStatus: "WITHDRAWN",
      }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/login");
        return;
      }
      setError(
        err?.response?.data?.message || err?.message || "Rút bài thất bại."
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <section className="dash-section">Đang tải...</section>
        </main>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="dash-page">
        <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
        <main className="dash-main">
          <section className="dash-section">
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error || "Không tìm thấy submission."}
              {debugInfo ? (
                <div
                  style={{ marginTop: 8, fontSize: "0.85rem", color: "#444" }}
                >
                  <strong>Debug:</strong>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                    {debugInfo}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => navigate(-1)}>
                Quay lại
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setError("");
                  setDebugInfo("");
                  setLoading(true);
                  // re-run effect by navigating to same route (force reload)
                  navigate(`/author/submissions/${id}`, { replace: true });
                }}
              >
                Thử lại
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Dashboard tác giả" />
      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/author/submissions" className="breadcrumb-link">
                  Bài nộp
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">
                  Submission #{submission.id}
                </span>
              </div>
              <h1 className="data-page-title">{submission.title}</h1>
              <p className="data-page-subtitle">
                {submission.trackName || submission.trackId}
              </p>
            </div>
            <div className="data-page-header-right">
              <div className="status-badge-wrapper">
                <span className={`badge badge-${getStatusClass(submission.status || submission.reviewStatus)}`}>
                  {submission.status || submission.reviewStatus}
                </span>
                <div className="status-date">
                  Cập nhật: {formatDate(submission.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            {/* Main Content */}
            <div className="detail-main">
              <div className="detail-card">
                <div className="detail-card-header">
                  <h3>Abstract</h3>
                </div>
                <div className="detail-card-body">
                  <p className="abstract-text">
                    {submission.abstractText || submission.abstract}
                  </p>
                </div>
              </div>

              {submission.downloadUrl && (
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3>File bài báo</h3>
                  </div>
                  <div className="detail-card-body">
                    <a
                      href={submission.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                    >
                      Tải file bài báo
                    </a>
                  </div>
                </div>
              )}

              {/* Reviews preview */}
              {reviews && reviews.length > 0 && (
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3>Kết quả chấm ({reviews.length})</h3>
                  </div>
                  <div className="detail-card-body">
                    {reviews.slice(0, 3).map((r, idx) => (
                      <div key={r.id || idx} className="review-preview">
                        <div className="review-preview-header">
                          <strong>Review #{idx + 1}</strong>
                          <span className="review-score">
                            Score: {r.score}
                          </span>
                        </div>
                        {r.commentForAuthor && (
                          <div className="review-preview-comment">
                            {r.commentForAuthor}
                          </div>
                        )}
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          navigate(
                            `/author/submissions/${submission.id}/reviews`
                          )
                        }
                      >
                        Xem tất cả reviews
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Decision preview */}
              {decision &&
                (decision.status === "ACCEPTED" ||
                  decision.status === "REJECTED") && (
                  <div className={`detail-card decision-card decision-${decision.status.toLowerCase()}`}>
                    <div className="detail-card-header">
                      <h3>
                        {decision.status === "ACCEPTED"
                          ? "Chấp nhận"
                          : "Từ chối"}
                      </h3>
                    </div>
                    <div className="detail-card-body">
                      {decision.comment && (
                        <div className="decision-comment">
                          {decision.comment}
                        </div>
                      )}
                      <div className="decision-date">
                        Quyết định:{" "}
                        {decision.decidedAt
                          ? new Date(decision.decidedAt).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="detail-sidebar">
              <div className="detail-card">
                <div className="detail-card-header">
                  <h3>Thông tin</h3>
                </div>
                <div className="detail-card-body">
                  <div className="info-item">
                    <span className="info-label">Hội nghị:</span>
                    <span className="info-value">
                      {submission.conferenceName || (submission.conferenceId ? `Hội nghị #${submission.conferenceId}` : "N/A")}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Track:</span>
                    <span className="info-value">
                      {submission.trackName || submission.trackId || "N/A"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-value">
                      {submission.status || submission.reviewStatus || "-"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ngày nộp:</span>
                    <span className="info-value">
                      {formatDate(submission.submittedAt || submission.createdAt)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Cập nhật:</span>
                    <span className="info-value">
                      {formatDate(submission.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-card-header">
                  <h3>Tác giả</h3>
                </div>
                <div className="detail-card-body">
                  <div className="author-main">
                    {submission.authorName || submission.ownerName || "Bạn"}
                  </div>
                  {submission.coAuthors && submission.coAuthors.length > 0 && (
                    <div className="coauthors-section">
                      <div className="coauthors-label">Đồng tác giả:</div>
                      <ul className="coauthors-list">
                        {submission.coAuthors.map((c, i) => (
                          <li key={i} className="coauthor-item">
                            <div className="coauthor-name">
                              {c.name || c.fullName}
                            </div>
                            {c.email && (
                              <div className="coauthor-email">{c.email}</div>
                            )}
                            {c.affiliation && (
                              <div className="coauthor-affiliation">
                                {c.affiliation}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {submission.keywords && (
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3>Từ khóa</h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="keywords-list">
                      {(submission.keywords || "")
                        .toString()
                        .split(/[;,]+/)
                        .map((k) => k.trim())
                        .filter(Boolean)
                        .slice(0, 10)
                        .map((k, i) => (
                          <span key={i} className="keyword-tag">
                            {k}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-actions">
            {submission.status === "SUBMITTED" && (
              <button
                className="btn-secondary"
                onClick={() =>
                  navigate(`/author/submissions/${submission.id}/edit`)
                }
              >
                Sửa
              </button>
            )}

            {(submission.status === "SUBMITTED" ||
              submission.status === "UNDER_REVIEW") && (
              <button
                className="btn-secondary btn-danger"
                disabled={withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing ? "Đang rút..." : "Rút bài"}
              </button>
            )}

            {(submission.status === "ACCEPTED" ||
              submission.status === "REJECTED") && (
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/author/submissions/${submission.id}/reviews`)
                }
              >
                Xem Reviews
              </button>
            )}

            {submission.status === "ACCEPTED" &&
              !submission.cameraReadyPath &&
              !submission.cameraReadyDownloadUrl && (
                <button
                  className="btn-primary"
                  onClick={() =>
                    navigate(
                      `/author/submissions/${submission.id}/camera-ready`
                    )
                  }
                >
                  Upload Camera-Ready
                </button>
              )}

            {submission.status === "ACCEPTED" &&
              (submission.cameraReadyPath ||
                submission.cameraReadyDownloadUrl) && (
                <a
                  href={
                    submission.cameraReadyDownloadUrl ||
                    (submission.cameraReadyPath
                      ? `/uploads/camera-ready/${submission.cameraReadyPath}`
                      : "#")
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Đã nộp camera-ready — Tải về
                </a>
              )}

            <button className="btn-secondary" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorSubmissionDetail;
