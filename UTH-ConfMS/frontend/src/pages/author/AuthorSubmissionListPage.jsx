// src/pages/author/AuthorSubmissionListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { FiSearch, FiFilter, FiTrendingUp } from "react-icons/fi";
import { formatDateTime } from "../../utils/dateUtils";
import "../../styles/AuthorPages.css";

const AuthorSubmissionListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confId = searchParams.get("confId");
  const [submissions, setSubmissions] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingConfs, setLoadingConfs] = useState(false);
  const [error, setError] = useState("");
  const [confError, setConfError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let ignore = false;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await apiClient.get(
          confId ? `/submissions?conferenceId=${confId}` : "/submissions"
        );
        if (!ignore) {
          const submissions = Array.isArray(res.data) ? res.data : [];
          setSubmissions(submissions);
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
            t('author.submissions.noSubmissions');
          setError(msg);
          setDebugInfo(
            `Status: ${status || "unknown"}, URL: ${err?.config?.url || "n/a"
            }, detail: ${err?.response?.data
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
  }, [confId, navigate, t]);

  useEffect(() => {
    let ignore = false;

    const fetchConferences = async () => {
      try {
        setLoadingConfs(true);
        setConfError("");
        const res = await apiClient.get("/conferences", {
          skipAuth: true,
        });
        if (!ignore) {
          setConferences(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading conferences", err);
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          setConfError(t('app.error'));
        }
      } finally {
        if (!ignore) setLoadingConfs(false);
      }
    };

    fetchConferences();
    return () => {
      ignore = true;
    };
  }, [navigate, t]);

  const handleWithdraw = async (id) => {
    if (!id) return;
    const confirm = window.confirm(t('author.submissions.confirmDelete'));
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
        t('app.error');
      setError(msg);
      setDebugInfo(
        `Withdraw failed. Status: ${status || "unknown"}, detail: ${err?.response?.data
          ? JSON.stringify(err.response.data)
          : err?.message || "no message"
        }`
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { class: "submitted", label: t('status.submitted').toUpperCase() },
      UNDER_REVIEW: { class: "under-review", label: t('status.underReview').toUpperCase() },
      ACCEPTED: { class: "accepted", label: t('status.accepted').toUpperCase() },
      REJECTED: { class: "rejected", label: t('status.rejected').toUpperCase() },
      WITHDRAWN: { class: "withdrawn", label: t('status.withdrawn').toUpperCase() },
    };
    const statusInfo = statusMap[status] || { class: "submitted", label: status };
    return <span className={`status-badge-compact ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  return (
    <div className="dash-page">
      <PortalHeader
        title="UTH Conference Portal · Author"
        ctaHref="/author/dashboard"
      />

      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">
                  {t('app.portal')}
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{t('author.submissions.title')}</span>
              </div>
              <h1 className="data-page-title">{t('author.submissions.title')}</h1>
              <p className="data-page-subtitle">
                {confId
                  ? `${t('common.conference')}: ${conferences.find(c => c.id === parseInt(confId))?.name || `ID #${confId}`}`
                  : t('author.submissions.subtitle')}
              </p>
            </div>
            <div className="data-page-header-right">
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/author/submissions/new")}
              >
                + {t('author.submissions.newSubmission')}
              </button>
            </div>
          </div>

          {/* Filter Style */}
          <div
            style={{
              marginBottom: "1.25rem",
              background: "white",
              borderRadius: "10px",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}>
                  {t('common.conference')}:
                </label>
                <select
                  value={confId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      navigate("/author/submissions");
                    } else {
                      navigate(`/author/submissions?confId=${value}`);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "white",
                    color: "#475569",
                  }}
                >
                  <option value="">{t('common.all')} {t('common.conferences').toLowerCase()}</option>
                  {conferences.map((conf) => (
                    <option key={conf.id} value={conf.id}>
                      {conf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}>
                  {t('app.search')}:
                </label>
                <div style={{ position: "relative" }}>
                  <FiSearch style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    width: "16px",
                    height: "16px"
                  }} />
                  <input
                    type="text"
                    placeholder={t('app.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.875rem 0.5rem 2.5rem",
                      borderRadius: "8px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "0.8125rem",
                      background: "white",
                      color: "#475569",
                    }}
                  />
                </div>
              </div>
            </div>

            {loadingConfs && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "#6b7280" }}>
                {t('app.loading')}
              </div>
            )}
          </div>

          {confError && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {confError}
            </div>
          )}

          {/* Filter & Sort Controls */}
          {submissions.length > 0 && (
            <div className="filter-sort-controls" style={{ marginBottom: "1.25rem" }}>
              <div className="filter-section">
                <div className="filter-label">
                  <FiFilter />
                  <span>{t('app.filter')}:</span>
                </div>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    {t('common.all')}
                    <span className="filter-count">{submissions.length}</span>
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === 'SUBMITTED' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('SUBMITTED')}
                  >
                    {t('status.submitted')}
                    <span className="filter-count">
                      {submissions.filter(s => s.status === 'SUBMITTED').length}
                    </span>
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === 'UNDER_REVIEW' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('UNDER_REVIEW')}
                  >
                    {t('status.underReview')}
                    <span className="filter-count">
                      {submissions.filter(s => s.status === 'UNDER_REVIEW').length}
                    </span>
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === 'ACCEPTED' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ACCEPTED')}
                  >
                    {t('status.accepted')}
                    <span className="filter-count">
                      {submissions.filter(s => s.status === 'ACCEPTED').length}
                    </span>
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('REJECTED')}
                  >
                    {t('status.rejected')}
                    <span className="filter-count">
                      {submissions.filter(s => s.status === 'REJECTED').length}
                    </span>
                  </button>
                  <button
                    className={`filter-btn ${statusFilter === 'WITHDRAWN' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('WITHDRAWN')}
                  >
                    {t('status.withdrawn')}
                    <span className="filter-count">
                      {submissions.filter(s => s.status === 'WITHDRAWN').length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="sort-section">
                <div className="sort-label">
                  <FiTrendingUp />
                  <span>{t('app.sort')}:</span>
                </div>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">{t('app.next')}</option>
                  <option value="oldest">{t('app.previous')}</option>
                  <option value="title">{t('common.title')}</option>
                </select>
              </div>
            </div>
          )}

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
              {t('app.loading')}
            </div>
          )}

          {/* Card Grid Style */}
          {!loading && submissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>{t('author.submissions.noSubmissions')}</h3>
              <p>{t('author.dashboard.startSubmitting')}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/author/submissions/new")}
              >
                + {t('author.submissions.newSubmission')}
              </button>
            </div>
          ) : (
            <div className="submission-grid">
              {submissions
                .filter((s) => {
                  if (statusFilter !== 'ALL' && s.status !== statusFilter) {
                    return false;
                  }
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    s.title?.toLowerCase().includes(query) ||
                    s.conferenceName?.toLowerCase().includes(query) ||
                    s.trackName?.toLowerCase().includes(query)
                  );
                })
                .sort((a, b) => {
                  if (sortBy === 'newest') {
                    return b.id - a.id;
                  } else if (sortBy === 'oldest') {
                    return a.id - b.id;
                  } else if (sortBy === 'title') {
                    return (a.title || '').localeCompare(b.title || '');
                  }
                  return 0;
                })
                .map((s) => (
                  <div key={s.id} className="submission-card">
                    <div className="submission-card-header">
                      <span className="submission-id">#{s.id}</span>
                      {getStatusBadge(s.status || s.reviewStatus)}
                    </div>

                    <h3 className="submission-title">{s.title}</h3>

                    <div className="submission-meta">
                      <div className="meta-row">
                        <span className="meta-label">{t('common.conference').toUpperCase()}:</span>
                        <span className="meta-value">{s.conferenceName || s.conferenceId || "-"}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">{t('common.track').toUpperCase()}:</span>
                        <span className="meta-value">{s.trackName || s.trackCode || s.trackId || "-"}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">{t('author.submissions.submittedAt').toUpperCase()}:</span>
                        <span className="meta-value">{formatDateTime(s.submittedAt || s.createdAt, false)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">{t('author.submissions.lastUpdated').toUpperCase()}:</span>
                        <span className="meta-value">{formatDateTime(s.updatedAt, false)}</span>
                      </div>
                    </div>

                    <div className="submission-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/author/submissions/${s.id}`)}
                      >
                        {t('app.details')}
                      </button>
                      {(s.status === "ACCEPTED" || s.status === "REJECTED") && (
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => navigate(`/author/submissions/${s.id}/reviews`)}
                        >
                          {t('author.submissions.viewReviews')}
                        </button>
                      )}
                      {s.status === "SUBMITTED" && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/author/submissions/${s.id}/edit`)}
                        >
                          {t('app.edit')}
                        </button>
                      )}
                      {(s.status === "SUBMITTED" || s.status === "UNDER_REVIEW") && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm btn-danger"
                          disabled={withdrawingId === s.id}
                          onClick={() => handleWithdraw(s.id)}
                        >
                          {withdrawingId === s.id ? t('app.loading') : t('status.withdrawn')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{
          marginTop: "3rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.875rem"
        }}>
          © {new Date().getFullYear()} {t('public.home.footer')}
        </footer>
      </main>
    </div>
  );
};

export default AuthorSubmissionListPage;
