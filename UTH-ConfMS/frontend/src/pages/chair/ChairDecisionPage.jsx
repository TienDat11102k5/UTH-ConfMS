import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import { usePagination } from "../../hooks/usePagination";
import { FiFilter, FiTrendingUp, FiSearch, FiCheckCircle, FiXCircle, FiRefreshCw } from "react-icons/fi";
import EmailDraftModal from "../../components/EmailDraftModal";
import AIDecisionModal from "../../components/AIDecisionModal";
import AIReviewSummaryModal from "../../components/AIReviewSummaryModal";
import { ToastContainer } from "../../components/Toast";
import "../../styles/ReviewerAssignments.css";
import "../../styles/ChairDecisionPage.css";

const ChairDecisionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [reviews, setReviews] = useState({});
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [decision, setDecision] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailModal, setEmailModal] = useState({ show: false, paper: null, decision: null });
  const [aiDecisionModal, setAiDecisionModal] = useState({ show: false, paper: null });
  const [aiSummaryModal, setAiSummaryModal] = useState({ show: false, paper: null });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filteredPapers, 20);

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        setSelectedConference("ALL");
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  // Load papers and reviews
  useEffect(() => {
    if (!selectedConference) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // ✅ FIX: Clear old data to prevent stale UI
        setPapers([]);
        setReviews({});
        setAssignments({});
        
        let allPapers = [];

        if (selectedConference === "ALL") {
          for (const conf of conferences) {
            try {
              const papersRes = await apiClient.get(`/decisions/papers/${conf.id}`);
              const papersWithConfId = (papersRes.data || []).map(p => ({
                ...p,
                conferenceId: conf.id
              }));
              allPapers = [...allPapers, ...papersWithConfId];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          allPapers = (papersRes.data || []).map(p => ({
            ...p,
            conferenceId: selectedConference
          }));
        }

        // Chỉ lấy bài UNDER_REVIEW
        const underReviewPapers = allPapers.filter(p => p.status === 'UNDER_REVIEW');
        setPapers(underReviewPapers);

        // Load reviews và assignments cho mỗi bài - SONG SONG thay vì tuần tự
        const loadPromises = underReviewPapers.map(async (paper) => {
          try {
            const [reviewsRes, assignRes] = await Promise.all([
              apiClient.get(`/reviews/paper/${paper.id}`),
              apiClient.get(`/assignments/paper/${paper.id}`)
            ]);
            
            return {
              paperId: paper.id,
              reviews: reviewsRes.data || [],
              assignments: assignRes.data || []
            };
          } catch (err) {
            return {
              paperId: paper.id,
              reviews: [],
              assignments: []
            };
          }
        });

        // Đợi TẤT CẢ promises hoàn thành
        const results = await Promise.all(loadPromises);
        
        // Build maps từ results
        const reviewsMap = {};
        const assignmentsMap = {};
        
        results.forEach(result => {
          reviewsMap[result.paperId] = result.reviews;
          assignmentsMap[result.paperId] = result.assignments;
        });

        setReviews(reviewsMap);
        setAssignments(assignmentsMap);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedConference, conferences]);

  // Apply filters and sorting
  useEffect(() => {
    let result = papers;

    // Filter by review status
    if (statusFilter === 'READY') {
      // Bài đã có đủ reviews (tất cả assignments đã COMPLETED)
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        return paperAssignments.length > 0 &&
          paperAssignments.every(a => a.status === 'COMPLETED');
      });
    } else if (statusFilter === 'PENDING') {
      // Bài chưa có đủ reviews
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        return paperAssignments.length === 0 ||
          paperAssignments.some(a => a.status !== 'COMPLETED');
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.mainAuthor?.fullName?.toLowerCase().includes(query) ||
        p.track?.name?.toLowerCase().includes(query) ||
        p.conference?.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'score') {
      result.sort((a, b) => {
        const avgA = getAverageScore(a.id);
        const avgB = getAverageScore(b.id);
        return avgB - avgA;
      });
    }

    setFilteredPapers(result);
    setCurrentPage(1);
  }, [papers, statusFilter, sortBy, searchQuery, assignments, reviews, setCurrentPage]);

  const getAverageScore = (paperId) => {
    const paperReviews = reviews[paperId] || [];
    if (paperReviews.length === 0) return 0;
    const sum = paperReviews.reduce((acc, r) => acc + (r.score || 0), 0);
    return sum / paperReviews.length;
  };

  const getRecommendation = (paperId) => {
    const paperReviews = reviews[paperId] || [];
    if (paperReviews.length === 0) return null;

    const accepts = paperReviews.filter(r => r.recommendation === 'ACCEPT').length;
    const rejects = paperReviews.filter(r => r.recommendation === 'REJECT').length;

    if (accepts > rejects) return 'ACCEPT';
    if (rejects > accepts) return 'REJECT';
    return 'MIXED';
  };

  const canMakeDecision = (paperId) => {
    const paperAssignments = assignments[paperId] || [];
    return paperAssignments.length > 0 &&
      paperAssignments.every(a => a.status === 'COMPLETED');
  };

  const submitDecision = async () => {
    if (!decision) {
      addToast(t('chair.decisions.selectDecision'), "warning");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/decisions", {
        paperId: selectedPaper.id,
        status: decision,
        comment: null,
      });
      addToast(t('chair.decisions.decisionSuccess'), "success");
      setSelectedPaper(null);
      setDecision("");
      // Reload data
      window.location.reload();
    } catch (err) {
      addToast(t('errors.prefix') + (err.response?.data || err.message), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.decisions.title')}>
        <TableSkeleton rows={6} columns={7} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.decisions.title')}
      subtitle={t('chair.decisions.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">{t('roles.chair')}</span>
          </div>
          <h2 className="data-page-title">{t('chair.decisions.pageTitle')}</h2>
          <p className="data-page-subtitle">
            {t('chair.decisions.pageSubtitle')}
          </p>
        </div>

        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate("/chair")}
          >
            {t('app.back')}
          </button>
        </div>
      </div>

      {/* Conference Selector */}
      {conferences.length > 0 && (
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
                {t('chair.decisions.selectConference')}
              </label>
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
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
                <option value="ALL">{t('chair.assignments.allConferences')}</option>
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
                {t('chair.decisions.search')}
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
                  placeholder={t('chair.decisions.searchPlaceholder')}
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
        </div>
      )}

      {/* Filter & Sort Controls */}
      {papers.length > 0 && (
        <div className="filter-sort-controls">
          <div className="filter-section">
            <div className="filter-label">
              <FiFilter />
              <span>{t('chair.decisions.filter')}</span>
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                {t('chair.decisions.all')}
                <span className="filter-count">{papers.length}</span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'READY' ? 'active' : ''}`}
                onClick={() => setStatusFilter('READY')}
              >
                {t('chair.decisions.readyForDecision')}
                <span className="filter-count">
                  {papers.filter(p => canMakeDecision(p.id)).length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDING')}
              >
                {t('chair.decisions.notEnoughReviews')}
                <span className="filter-count">
                  {papers.filter(p => !canMakeDecision(p.id)).length}
                </span>
              </button>
            </div>
          </div>

          <div className="sort-section">
            <div className="sort-label">
              <FiTrendingUp />
              <span>{t('chair.decisions.sort')}</span>
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t('chair.decisions.newest')}</option>
              <option value="oldest">{t('chair.decisions.oldest')}</option>
              <option value="score">{t('chair.decisions.highestScore')}</option>
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        {papers.length === 0 ? (
          <EmptyState
            icon="check"
            title={t('chair.decisions.noPapersTitle')}
            description={t('chair.decisions.noPapersDescription')}
            size="large"
          />
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>{t('chair.decisions.paperTitle')}</th>
                <th>{t('chair.decisions.track')}</th>
                <th>{t('chair.decisions.author')}</th>
                <th>{t('chair.decisions.reviews')}</th>
                <th>{t('chair.decisions.avgScore')}</th>
                <th>{t('chair.decisions.recommendation')}</th>
                <th>{t('chair.decisions.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((paper) => {
                const paperReviews = reviews[paper.id] || [];
                const paperAssignments = assignments[paper.id] || [];
                const avgScore = getAverageScore(paper.id);
                const recommendation = getRecommendation(paper.id);
                const ready = canMakeDecision(paper.id);

                return (
                  <tr key={paper.id}>
                    <td>
                      <strong>{paper.title}</strong>
                      {selectedConference === "ALL" && paper.conference && (
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "0.25rem",
                          fontWeight: 500
                        }}>
                          🏛️ {paper.conference.name}
                        </div>
                      )}
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>
                      <div style={{ fontSize: "0.875rem" }}>
                        {paperReviews.length}/{paperAssignments.length}
                        {!ready && (
                          <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                            {t('chair.decisions.notEnough')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        color: avgScore >= 1 ? "#10b981" : avgScore <= -1 ? "#ef4444" : "#6b7280"
                      }}>
                        {avgScore.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {recommendation === 'ACCEPT' && (
                        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <FiCheckCircle size={14} /> {t('chair.decisions.accept')}
                        </span>
                      )}
                      {recommendation === 'REJECT' && (
                        <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <FiXCircle size={14} /> {t('chair.decisions.reject')}
                        </span>
                      )}
                      {recommendation === 'MIXED' && (
                        <span className="badge badge-warning">{t('chair.decisions.mixed')}</span>
                      )}
                      {!recommendation && (
                        <span style={{ color: "#999", fontSize: "0.875rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                        <button
                          className="btn-primary table-action"
                          onClick={() => {
                            setSelectedPaper(paper);
                            setDecision("");
                          }}
                          disabled={!ready}
                          style={{ minWidth: "110px", fontSize: "0.8125rem" }}
                          title={!ready ? t('chair.decisions.needAllReviews') : ""}
                        >
                          {t('chair.decisions.makeDecision')}
                        </button>

                        {paperReviews.length > 0 && (
                          <>
                            <button
                              onClick={() => setAiDecisionModal({ show: true, paper })}
                              style={{
                                padding: "0.5rem 0.75rem",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem"
                              }}
                              title={t('chair.decisions.aiSuggestion')}
                            >
                              ✨ {t('chair.decisions.suggest')}
                            </button>

                            <button
                              onClick={() => setAiSummaryModal({ show: true, paper })}
                              style={{
                                padding: "0.5rem 0.75rem",
                                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem"
                              }}
                              title={t('chair.decisions.aiSummary')}
                            >
                              ✨ {t('chair.decisions.summary')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredPapers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPapers.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName={t('common.papers')}
        />
      )}

      {/* Modal */}
      {selectedPaper && (
        <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <h3 style={{ marginBottom: "1rem" }}>{selectedPaper.title}</h3>

            {/* Tổng hợp đánh giá */}
            <div style={{
              background: "#f8fafc",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    {t('chair.decisions.reviewCount')}
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                    {(reviews[selectedPaper.id] || []).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    {t('chair.decisions.avgScoreLabel')}
                  </div>
                  <div style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: getAverageScore(selectedPaper.id) >= 1 ? "#10b981" :
                      getAverageScore(selectedPaper.id) <= -1 ? "#ef4444" : "#6b7280"
                  }}>
                    {getAverageScore(selectedPaper.id).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    {t('chair.decisions.overallRecommendation')}
                  </div>
                  <div style={{ marginTop: "0.25rem" }}>
                    {getRecommendation(selectedPaper.id) === 'ACCEPT' && (
                      <span className="badge badge-success">{t('chair.decisions.accept')}</span>
                    )}
                    {getRecommendation(selectedPaper.id) === 'REJECT' && (
                      <span className="badge badge-danger">{t('chair.decisions.reject')}</span>
                    )}
                    {getRecommendation(selectedPaper.id) === 'MIXED' && (
                      <span className="badge badge-warning">{t('chair.decisions.mixed')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chi tiết từng đánh giá */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "#374151" }}>
                  {t('chair.decisions.reviewDetails')}
                </div>
                {(reviews[selectedPaper.id] || []).map((review, idx) => (
                  <div key={review.id} style={{
                    background: "white",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1f2937" }}>
                        {review.assignment?.reviewer?.fullName || `${t('chair.decisions.reviewer')} #${idx + 1}`}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          color: review.score >= 1 ? "#10b981" : review.score <= -1 ? "#ef4444" : "#6b7280"
                        }}>
                          {t('chair.decisions.score')}: {review.score}
                        </span>
                        {review.recommendation === 'ACCEPT' && (
                          <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>{t('chair.decisions.accept')}</span>
                        )}
                        {review.recommendation === 'REJECT' && (
                          <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>{t('chair.decisions.reject')}</span>
                        )}
                      </div>
                    </div>
                    {review.commentForAuthor && (
                      <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                        <strong>{t('chair.decisions.publicComment')}:</strong> {review.commentForAuthor}
                      </div>
                    )}
                    {review.commentForPC && (
                      <div style={{ 
                        fontSize: "0.8125rem", 
                        color: "#dc2626", 
                        background: "#fef2f2",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #fecaca"
                      }}>
                        <strong>{t('chair.decisions.confidentialComment')}:</strong> {review.commentForPC}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Form */}
            <div className="form-group">
              <label className="form-label">{t('chair.decisions.chairDecision')}</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="form-input"
              >
                <option value="">{t('chair.decisions.selectDecisionOption')}</option>
                <option value="ACCEPTED">✓ {t('chair.decisions.acceptOption')}</option>
                <option value="REJECTED">✗ {t('chair.decisions.rejectOption')}</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                disabled={submitting || !decision}
                onClick={submitDecision}
              >
                {submitting ? t('chair.decisions.processing') : t('chair.decisions.confirmDecision')}
              </button>

              {decision && (
                <button
                  onClick={() => {
                    setEmailModal({
                      show: true,
                      paper: selectedPaper,
                      decision: decision
                    });
                  }}
                  disabled={submitting}
                  style={{
                    padding: "0.625rem 1rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  title={t('chair.decisions.draftEmailAI')}
                >
                  ✨ {t('chair.decisions.draftAIEmail')}
                </button>
              )}

              <button
                className="btn-secondary"
                onClick={() => setSelectedPaper(null)}
                disabled={submitting}
              >
                {t('app.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Decision Modal */}
      {aiDecisionModal.show && (
        <AIDecisionModal
          paper={aiDecisionModal.paper}
          reviews={reviews[aiDecisionModal.paper.id] || []}
          onClose={() => setAiDecisionModal({ show: false, paper: null })}
        />
      )}

      {/* AI Summary Modal */}
      {aiSummaryModal.show && (
        <AIReviewSummaryModal
          paper={aiSummaryModal.paper}
          reviews={reviews[aiSummaryModal.paper.id] || []}
          onClose={() => setAiSummaryModal({ show: false, paper: null })}
        />
      )}

      {/* Email Draft Modal */}
      {emailModal.show && (
        <EmailDraftModal
          paper={emailModal.paper}
          decision={emailModal.decision}
          conferenceName={emailModal.paper?.conference?.name}
          onClose={() => setEmailModal({ show: false, paper: null, decision: null })}
          onSend={async () => {
            // Sau khi gửi email thành công, tự động submit quyết định
            try {
              await apiClient.post("/decisions", {
                paperId: emailModal.paper.id,
                status: emailModal.decision,
                comment: null,
                skipEmail: true // Bỏ qua email tự động vì đã gửi bằng AI
              });
              addToast(t('chair.decisions.emailAndDecisionSuccess'), "success");
              setEmailModal({ show: false, paper: null, decision: null });
              setSelectedPaper(null);
              setDecision("");
              window.location.reload();
            } catch (err) {
              addToast(t('chair.decisions.emailSentButSaveError') + (err.response?.data || err.message), "warning");
            }
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ChairDecisionPage;
