// src/pages/author/AuthorSubmissionDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { CardSkeleton } from "../../components/LoadingSkeleton";

const formatDate = (value) => {
  if (!value) return "";
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return "";
    // Không cần cộng thêm timezone vì backend đã trả về đúng giờ
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  } catch {
    return value;
  }
};

const AuthorSubmissionDetail = () => {
  const { t } = useTranslation();
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
          try {
            const rev = await apiClient.get(`/reviews/paper/${id}/for-author`);
            if (!ignore) setReviews(Array.isArray(rev.data) ? rev.data : []);
          } catch (e) { }
          try {
            const dec = await apiClient.get(`/decisions/paper/${id}`);
            if (!ignore) setDecision(dec.data || null);
          } catch (e) { }
        }
      } catch (err) {
        if (!ignore) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          setError(err?.response?.data?.message || err?.message || t('app.error'));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (id) load();
    return () => { ignore = true; };
  }, [id, navigate, t]);

  const handleWithdraw = async () => {
    if (!submission?.id) return;
    if (!window.confirm(t('author.submissions.confirmDelete'))) return;
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
      setError(err?.response?.data?.message || err?.message || t('app.error'));
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: t('status.submitted'), color: "#3b82f6" },
      UNDER_REVIEW: { label: t('status.underReview'), color: "#f59e0b" },
      ACCEPTED: { label: t('status.accepted'), color: "#10b981" },
      REJECTED: { label: t('status.rejected'), color: "#ef4444" },
      WITHDRAWN: { label: t('status.withdrawn'), color: "#6b7280" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#6b7280" };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "0.375rem",
        padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "0.875rem",
        fontWeight: 600, background: `${statusInfo.color}15`, color: statusInfo.color,
        border: `1px solid ${statusInfo.color}30`
      }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Author" title={t('author.submissions.viewDetails')}>
        <CardSkeleton count={1} />
      </DashboardLayout>
    );
  }

  if (error || !submission) {
    return (
      <DashboardLayout roleLabel="Author" title={t('author.submissions.viewDetails')}>
        <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)" }}>
          <h3 style={{ marginBottom: "0.5rem", color: "#1f2937" }}>{t('app.error')}</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{error || t('author.submissions.noSubmissions')}</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button className="btn-secondary" onClick={() => navigate(-1)}>← {t('app.back')}</button>
            <button className="btn-primary" onClick={() => window.location.reload()}>{t('errors.tryAgain')}</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout roleLabel="Author" title={t('author.submissions.viewDetails')} subtitle={t('author.submissions.subtitle')}>
      <div style={{ marginBottom: "1rem" }}>
        <button className="btn-back" onClick={() => navigate(-1)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1.5px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }}>
          ← {t('app.back')}
        </button>
      </div>

      <div className="data-page-header">
        <div className="data-page-header-left">
          <h2 className="data-page-title" style={{ marginTop: "0.5rem" }}>{submission.title}</h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {getStatusBadge(submission.status || submission.reviewStatus)}
            <span style={{ padding: "0.25rem 0.625rem", background: "#e0f2f1", color: "#00695c", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600 }}>
              {submission.trackName || submission.trackId}
            </span>
          </div>
        </div>
        <div className="data-page-header-right" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {submission.status === "SUBMITTED" && (
            <button className="btn-secondary" onClick={() => navigate(`/author/submissions/${submission.id}/edit`)}>{t('app.edit')}</button>
          )}
          {submission.status === "ACCEPTED" && !submission.cameraReadyPath && !submission.cameraReadyDownloadUrl && (
            <button className="btn-primary" onClick={() => navigate(`/author/submissions/${submission.id}/camera-ready`)}>{t('author.cameraReady.uploadFinal')}</button>
          )}
          {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
            <button className="btn-secondary" style={{ color: "#ef4444", borderColor: "#ef4444" }} disabled={withdrawing} onClick={handleWithdraw}>
              {withdrawing ? t('app.loading') : t('status.withdrawn')}
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem 1.25rem", borderRadius: "8px", marginBottom: "1.5rem", color: "#991b1b" }}>{error}</div>}

      {decision && (decision.status === "ACCEPTED" || decision.status === "REJECTED") && (
        <div style={{ background: decision.status === "ACCEPTED" ? "#ecfdf5" : "#fef2f2", border: `2px solid ${decision.status === "ACCEPTED" ? "#10b981" : "#ef4444"}`, padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: decision.status === "ACCEPTED" ? "#065f46" : "#991b1b", fontSize: "1.125rem", fontWeight: 700 }}>
            {decision.status === "ACCEPTED" ? `🎉 ${t('status.accepted')}` : t('status.rejected')}
          </h3>
          <div style={{ fontSize: "0.875rem", color: decision.status === "ACCEPTED" ? "#047857" : "#b91c1c", marginBottom: "0.75rem" }}>{formatDate(decision.decidedAt)}</div>
          {decision.comment && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem" }}>{t('common.comments')}:</div>
              <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6 }}>{decision.comment}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* File Downloads */}
        <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>{t('common.files')}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {submission.downloadUrl && (
              <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>{t('common.file')} PDF</div>
                  <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{t('author.submissions.submittedAt')}</div>
                </div>
                <a href={submission.downloadUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>{t('app.download')}</a>
              </div>
            )}
            {(submission.cameraReadyDownloadUrl || submission.cameraReadyPath) && (
              <div style={{ padding: "1rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>{t('author.cameraReady.title')}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#15803d" }}>{t('author.cameraReady.alreadySubmitted')}</div>
                </div>
                <a href={submission.cameraReadyDownloadUrl || submission.cameraReadyPath} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>{t('app.download')}</a>
              </div>
            )}
            {!submission.downloadUrl && !submission.cameraReadyDownloadUrl && !submission.cameraReadyPath && (
              <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>{t('app.noData')}</div>
            )}
          </div>
        </div>

        {/* Abstract */}
        <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>{t('common.abstract')}</div>
          <p style={{ margin: 0, color: "#374151", lineHeight: 1.7, fontSize: "0.9375rem" }}>{submission.abstractText || submission.abstract}</p>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {/* Authors */}
          <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
            <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>{t('common.authors')}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>{submission.authorName || submission.ownerName || t('common.author')}</div>
                <div style={{ fontSize: "0.8125rem", color: "#0d9488", fontWeight: 600 }}>{t('author.form.correspondingAuthor')}</div>
              </div>
              {submission.coAuthors && submission.coAuthors.length > 0 && submission.coAuthors.map((c, i) => (
                <div key={i} style={{ padding: "0.75rem", background: "#fafbfc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>{c.name || c.fullName}</div>
                  {c.email && <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{c.email}</div>}
                  {c.affiliation && <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "0.125rem" }}>{c.affiliation}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Keywords & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {submission.keywords && submission.keywords.trim() !== '' ? (
              <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>{t('common.keywords')}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(submission.keywords || "").toString().split(/[;,]+/).map((k) => k.trim()).filter(Boolean).slice(0, 10).map((k, i) => (
                    <span key={i} style={{ padding: "0.375rem 0.75rem", background: "#f0fdfa", color: "#0d9488", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600, border: "1px solid #ccfbf1" }}>{k}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
              <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>{t('app.details')}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>{t('common.conference')}</div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>{submission.conferenceName || submission.conferenceId}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>{t('author.submissions.submittedAt')}</div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>{formatDate(submission.submittedAt || submission.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.25rem" }}>{t('author.submissions.lastUpdated')}</div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>{formatDate(submission.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>
                {t('common.reviews')}
                <span style={{ padding: "0.125rem 0.5rem", background: "#f1f5f9", color: "#475569", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>{reviews.length}</span>
              </div>
              {reviews.length > 2 && (
                <button className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }} onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}>
                  {t('app.view')} →
                </button>
              )}
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              {reviews.slice(0, 2).map((r, idx) => (
                <div key={r.id || idx} style={{ padding: "1rem", background: "#fafbfc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.875rem" }}>Review #{idx + 1}</span>
                    <span style={{ padding: "0.25rem 0.75rem", background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "white", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 700 }}>{r.score}/3</span>
                  </div>
                  {r.commentForAuthor && <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6, fontSize: "0.875rem" }}>{r.commentForAuthor}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <button onClick={() => navigate(-1)} className="btn-secondary">← {t('app.back')}</button>
      </div>

      <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
        © {new Date().getFullYear()} {t('public.home.footer')}
      </footer>
    </DashboardLayout>
  );
};

export default AuthorSubmissionDetail;
