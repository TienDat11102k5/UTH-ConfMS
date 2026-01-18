// src/pages/author/AuthorPaperReviews.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { formatDateTime } from "../../utils/dateUtils";

const formatDate = (value) => {
  if (!value) return "";
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return "";

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
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return "";

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
  const { t } = useTranslation();
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

        const paperRes = await apiClient.get(`/submissions/${paperId}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          params: { _t: Date.now() }
        });
        setPaper(paperRes.data);

        if (paperRes.data.status === "ACCEPTED" || paperRes.data.status === "REJECTED") {
          try {
            const reviewsRes = await apiClient.get(`/reviews/paper/${paperId}/for-author`);
            setReviews(reviewsRes.data || []);
          } catch (err) { }

          try {
            const decisionRes = await apiClient.get(`/decisions/paper/${paperId}`);
            setDecision(decisionRes.data);
          } catch (err) { }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('author.reviews.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (paperId) loadData();

    const handleFocus = () => { if (paperId) loadData(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [paperId, t]);

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
        display: "inline-flex", alignItems: "center", padding: "0.375rem 0.75rem",
        borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600,
        background: `${statusInfo.color}15`, color: statusInfo.color,
        border: `1px solid ${statusInfo.color}30`
      }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Author" title={t('author.reviews.title')}>
        <div style={{ marginBottom: "1rem" }}>
          <button className="btn-back" onClick={() => navigate(-1)} style={{
            padding: "0.5rem 1rem", background: "transparent", border: "1.5px solid #e2e8f0",
            borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
            color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            ← {t('app.back')}
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <CardSkeleton count={2} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !paper) {
    return (
      <DashboardLayout roleLabel="Author" title={t('author.reviews.title')}>
        <div style={{ marginBottom: "1rem" }}>
          <button className="btn-back" onClick={() => navigate(-1)} style={{
            padding: "0.5rem 1rem", background: "transparent", border: "1.5px solid #e2e8f0",
            borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
            color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            ← {t('app.back')}
          </button>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)" }}>
          <h3 style={{ marginBottom: "0.5rem", color: "#1f2937" }}>{t('author.reviews.loadErrorTitle')}</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{error || t('author.reviews.notFound')}</p>
          <button className="btn-secondary" onClick={() => navigate("/author/submissions")}>
            ← {t('author.reviews.backToList')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const averageScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(2)
    : 0;

  return (
    <DashboardLayout roleLabel="Author" title={t('author.reviews.title')} subtitle={t('author.reviews.subtitle')}>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <h2 className="data-page-title" style={{ marginTop: "0.5rem" }}>{paper.title}</h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {getStatusBadge(paper.status)}
            <span style={{ padding: "0.25rem 0.625rem", background: "#e0f2f1", color: "#00695c", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600 }}>
              {paper.trackName || paper.trackId}
            </span>
            <span style={{ padding: "0.25rem 0.625rem", background: "#f1f5f9", color: "#475569", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600 }}>
              {t('author.reviews.submittedOn')}: {formatDate(paper.createdAt)}
            </span>
          </div>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" onClick={() => navigate(`/author/submissions/${paperId}`)}>
            {t('author.reviews.viewSubmission')}
          </button>
        </div>
      </div>

      {paper.status === "SUBMITTED" && (
        <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: "0.5rem", fontSize: "1rem" }}>
            {t('author.reviews.submittedSuccess')}
          </div>
          <p style={{ margin: 0, color: "#1e3a8a", lineHeight: 1.6 }}>{t('author.reviews.awaitingReview')}</p>
        </div>
      )}

      {paper.status === "UNDER_REVIEW" && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.5rem", fontSize: "1rem" }}>
            {t('author.reviews.underReview')}
          </div>
          <p style={{ margin: 0, color: "#78350f", lineHeight: 1.6 }}>{t('author.reviews.underReviewDesc')}</p>
        </div>
      )}

      {decision && (
        <div style={{
          background: paper.status === "ACCEPTED" ? "#ecfdf5" : "#fef2f2",
          border: `2px solid ${paper.status === "ACCEPTED" ? "#10b981" : "#ef4444"}`,
          padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: paper.status === "ACCEPTED" ? "#065f46" : "#991b1b", fontSize: "1.25rem", fontWeight: 700 }}>
              {paper.status === "ACCEPTED" ? `🎉 ${t('author.reviews.acceptedCongrats')}` : t('author.reviews.rejectedMessage')}
            </h3>
            <div style={{ fontSize: "0.875rem", color: paper.status === "ACCEPTED" ? "#047857" : "#b91c1c" }}>
              {t('author.reviews.decisionDate')}: {formatDateTimeLocal(decision.decidedAt)}
            </div>
          </div>
          {decision.comment && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#374151", fontSize: "0.875rem" }}>
                {t('author.reviews.chairComment')}:
              </div>
              <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6 }}>{decision.comment}</p>
            </div>
          )}
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, color: "#1f2937", fontSize: "1.125rem" }}>
                {t('author.reviews.reviewResults')}
                <span style={{ padding: "0.25rem 0.625rem", background: "#f1f5f9", color: "#475569", borderRadius: "12px", fontSize: "0.875rem", fontWeight: 700 }}>
                  {reviews.length} {t('author.reviews.reviews')}
                </span>
              </div>
              <div style={{ padding: "0.5rem 1rem", background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "white", borderRadius: "8px", fontWeight: 700, fontSize: "1.125rem" }}>
                {t('author.reviews.avgScore')}: {averageScore}/3
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {reviews.map((review, index) => (
              <div key={review.id} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1f2937", fontSize: "1rem", marginBottom: "0.25rem" }}>
                      {t('author.reviews.review')} #{index + 1}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                      {t('author.reviews.reviewDate')}: {formatDateTimeLocal(review.submittedAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{ padding: "0.5rem 1rem", background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "white", borderRadius: "8px", fontWeight: 700, fontSize: "1.125rem" }}>
                      {review.score}/3
                    </div>
                    <div style={{ padding: "0.375rem 0.75rem", background: "#f1f5f9", color: "#475569", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {t('author.reviews.confidence')}: {review.confidenceLevel}/5
                    </div>
                  </div>
                </div>

                {review.commentForAuthor && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
                      {t('author.reviews.comment')}:
                    </div>
                    <p style={{ margin: 0, color: "#374151", lineHeight: 1.7, fontSize: "0.9375rem", whiteSpace: "pre-wrap" }}>
                      {review.commentForAuthor}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && (paper.status === "ACCEPTED" || paper.status === "REJECTED") && (
        <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
            {t('author.reviews.noReviews')}
          </div>
          <div style={{ color: "#6b7280" }}>{t('author.reviews.noReviewsHidden')}</div>
        </div>
      )}

      {paper.status === "ACCEPTED" && (
        <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>
            {t('author.reviews.cameraReady')}
          </div>
          {(!paper.cameraReadyPath && !paper.cameraReadyDownloadUrl) ? (
            <div>
              <div style={{ padding: "1rem", background: "#fef3c7", borderRadius: "8px", marginBottom: "1rem", color: "#78350f", lineHeight: 1.6 }}>
                {t('author.reviews.cameraReadyRequired')}
              </div>
              <button className="btn-primary" onClick={() => navigate(`/author/submissions/${paperId}/camera-ready`)}>
                {t('author.reviews.uploadCameraReady')}
              </button>
            </div>
          ) : (
            <div style={{ padding: "1rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#15803d", marginBottom: "0.25rem" }}>
                  ✓ {t('author.reviews.cameraReadySubmitted')}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#166534" }}>{t('author.reviews.fileUploaded')}</div>
              </div>
              <a
                href={paper.cameraReadyDownloadUrl || (paper.cameraReadyPath ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:8080'}/uploads/camera-ready/${paper.cameraReadyPath}` : "#")}
                target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {t('app.download')}
              </a>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <button onClick={() => navigate("/author/submissions")} className="btn-secondary" style={{ transition: "all 0.2s ease" }}>
          ← {t('author.reviews.backToList')}
        </button>
      </div>

      <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
        © {new Date().getFullYear()} {t('public.home.footer')}
      </footer>
    </DashboardLayout>
  );
};

export default AuthorPaperReviews;
