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
              const rev = await apiClient.get(`/reviews/paper/${id}/for-author`);
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
          const msg = err?.response?.data?.message || err?.message || "Không thể tải submission.";
          setError(msg);
          setDebugInfo(
            `Status: ${status || "unknown"}, URL: ${err?.config?.url || "n/a"}, detail: ${
              err?.response?.data ? JSON.stringify(err.response.data) : err?.message || "no message"
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
                <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#444" }}>
                  <strong>Debug:</strong>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{debugInfo}</div>
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => navigate(-1)}>
                Quay lại
              </button>
              <button className="btn-primary" onClick={() => {
                setError("");
                setDebugInfo("");
                setLoading(true);
                // re-run effect by navigating to same route (force reload)
                navigate(`/author/submissions/${id}`, { replace: true });
              }}>
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
                <span className="breadcrumb-current">Submission #{submission.id}</span>
              </div>
              <h1 className="data-page-title">{submission.title}</h1>
              <p className="data-page-subtitle">{submission.trackName || submission.trackId}</p>
            </div>
            <div className="data-page-header-right">
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>Trạng thái: </strong>
                  <span>{submission.status || submission.reviewStatus}</span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Cập nhật: {formatDate(submission.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ marginTop: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <strong>Abstract</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{submission.abstractText || submission.abstract}</p>
                </div>

                {submission.downloadUrl && (
                  <div style={{ marginBottom: "1rem" }}>
                    <a href={submission.downloadUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                      Tải file bài báo
                    </a>
                  </div>
                )}

                {/* Reviews preview */}
                {reviews && reviews.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h4>Kết quả chấm ({reviews.length})</h4>
                    {reviews.slice(0, 3).map((r, idx) => (
                      <div key={r.id || idx} style={{ padding: '10px', background: '#f8fafc', borderRadius: 6, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Review #{idx + 1}</strong>
                          <span style={{ color: '#444' }}>Score: {r.score}</span>
                        </div>
                        {r.commentForAuthor && (
                          <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.commentForAuthor}</div>
                        )}
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <div style={{ marginTop: 6 }}>
                        <button className="btn-secondary" onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}>
                          Xem tất cả reviews
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Decision preview - chỉ hiển thị khi đã có quyết định cuối cùng */}
                {decision && (decision.status === 'ACCEPTED' || decision.status === 'REJECTED') && (
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: decision.status === 'ACCEPTED' ? '#e8f5e9' : '#ffebee' }}>
                    <h4 style={{ margin: 0 }}>{decision.status === 'ACCEPTED' ? '✅ Chấp nhận' : '❌ Từ chối'}</h4>
                    {decision.comment && <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{decision.comment}</div>}
                    <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#666' }}>Quyết định: {decision.decidedAt ? new Date(decision.decidedAt).toLocaleString() : 'N/A'}</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Thông tin</div>
                  <div><strong>Hội nghị:</strong> {submission.conferenceName || submission.conferenceId || 'N/A'}</div>
                  <div><strong>Track:</strong> {submission.trackName || submission.trackId || 'N/A'}</div>
                  <div><strong>Trạng thái:</strong> {submission.status || submission.reviewStatus || '-'}</div>
                  <div><strong>Ngày nộp:</strong> {formatDate(submission.submittedAt || submission.createdAt)}</div>
                  <div><strong>Cập nhật:</strong> {formatDate(submission.updatedAt)}</div>
                </div>

                <div style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Tác giả</div>
                  <div><strong>{submission.authorName || submission.ownerName || 'Bạn'}</strong></div>
                  {submission.coAuthors && submission.coAuthors.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 500 }}>Đồng tác giả:</div>
                      <ul style={{ margin: '6px 0 0 18px' }}>
                        {submission.coAuthors.map((c, i) => (
                          <li key={i}>{c.name || c.fullName} {c.email ? `— ${c.email}` : ''}{c.affiliation ? ` (${c.affiliation})` : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {submission.keywords && (
                  <div style={{ padding: 10, background: '#fafafa', borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Từ khóa</div>
                    <div>{(submission.keywords || '').toString().split(/[;,]+/).map(k => k.trim()).filter(Boolean).slice(0,10).map((k, i) => (
                      <span key={i} style={{ display: 'inline-block', background: '#eef2ff', color: '#1e3a8a', padding: '4px 8px', borderRadius: 4, marginRight: 6, marginBottom: 6 }}>{k}</span>
                    ))}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {submission.status === "SUBMITTED" && (
                <button className="btn-secondary" onClick={() => navigate(`/author/submissions/${submission.id}/edit`)}>
                  Sửa
                </button>
              )}

              {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
                <button className="btn-secondary" disabled={withdrawing} onClick={handleWithdraw}>
                  {withdrawing ? "Đang rút..." : "Rút bài"}
                </button>
              )}

              {(submission.status === "ACCEPTED" || submission.status === "REJECTED") && (
                <button className="btn-primary" onClick={() => navigate(`/author/submissions/${submission.id}/reviews`)}>
                  Xem Reviews
                </button>
              )}

              {submission.status === "ACCEPTED" && (
                <button className="btn-primary" onClick={() => navigate(`/author/submissions/${submission.id}/camera-ready`)}>
                  Upload Camera-Ready
                </button>
              )}

              <button className="btn-secondary" onClick={() => navigate(-1)}>
                Quay lại
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorSubmissionDetail;
