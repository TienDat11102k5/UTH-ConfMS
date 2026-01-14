// src/pages/chair/ChairAssignmentManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import { usePagination } from "../../hooks/usePagination";
import { FiFilter, FiTrendingUp, FiSearch } from "react-icons/fi";
import { ToastContainer } from "../../components/Toast";
import "../../styles/ReviewerAssignments.css";

const ChairAssignmentManagement = () => {
  const { t } = useTranslation();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
        // Mặc định chọn "Tất cả hội nghị"
        setSelectedConference("ALL");
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };

    // Debug: Check if user is logged in
    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    const user =
      sessionStorage.getItem("currentUser") ||
      localStorage.getItem("currentUser");
    console.log("=== DEBUG AUTH ===");
    console.log("Token exists:", !!token);
    console.log(
      "Token preview:",
      token ? token.substring(0, 20) + "..." : "null"
    );
    console.log("User:", user ? JSON.parse(user) : null);
    console.log("==================");

    loadConferences();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedConference) return;

      try {
        setLoading(true);
        setError("");

        let allPapers = [];

        // Nếu chọn "Tất cả hội nghị", load papers từ tất cả conferences
        if (selectedConference === "ALL") {
          console.log("Loading papers from all conferences");
          for (const conf of conferences) {
            try {
              const papersRes = await apiClient.get(`/decisions/papers/${conf.id}`);
              const confPapers = (papersRes.data || []).map(paper => ({
                ...paper,
                conferenceId: conf.id,
                conference: paper.conference || { id: conf.id, name: conf.name }
              }));
              allPapers = [...allPapers, ...confPapers];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          // Load papers của conference cụ thể
          console.log("Loading papers for conference:", selectedConference);
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          const confPapers = (papersRes.data || []).map(paper => ({
            ...paper,
            conferenceId: selectedConference,
            conference: paper.conference || { id: selectedConference }
          }));
          allPapers = confPapers;
        }

        console.log("Total papers loaded:", allPapers.length);
        setPapers(allPapers);

        // Load reviewers
        try {
          console.log("Loading reviewers...");
          const usersRes = await apiClient.get("/decisions/reviewers");
          console.log("Reviewers response:", usersRes.data);
          const allUsers = usersRes.data || [];
          setReviewers(allUsers);
        } catch (uErr) {
          console.error("Không thể tải danh sách reviewers:", uErr);
          setError(t('chair.assignments.loadReviewersError') + (uErr.response?.data || uErr.message));
        }

        // Load assignments for each paper
        const assignmentsMap = {};
        for (const paper of allPapers) {
          try {
            const assignRes = await apiClient.get(
              `/assignments/paper/${paper.id}`
            );
            assignmentsMap[paper.id] = assignRes.data || [];
          } catch (err) {
            assignmentsMap[paper.id] = [];
          }
        }
        setAssignments(assignmentsMap);
      } catch (err) {
        console.error("Load error:", err);
        setError(t('chair.assignments.loadError'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedConference, conferences]);

  // Apply filters and sorting whenever papers, filters, or sort changes
  useEffect(() => {
    let result = papers;

    // Filter by status
    if (statusFilter === 'UNASSIGNED') {
      result = papers.filter(p =>
        (!assignments[p.id] || assignments[p.id].length === 0) &&
        (p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW')
      );
    } else if (statusFilter === 'UNDER_REVIEW') {
      result = papers.filter(p => p.status === 'UNDER_REVIEW');
    } else if (statusFilter === 'WITHDRAWN') {
      result = papers.filter(p => p.status === 'WITHDRAWN');
    } else if (statusFilter === 'COMPLETED') {
      result = papers.filter(p => p.status === 'ACCEPTED' || p.status === 'REJECTED');
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
    } else if (sortBy === 'unassigned') {
      result.sort((a, b) => {
        const aAssigned = assignments[a.id]?.length || 0;
        const bAssigned = assignments[b.id]?.length || 0;
        return aAssigned - bAssigned;
      });
    }

    setFilteredPapers(result);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [papers, statusFilter, sortBy, searchQuery, assignments, setCurrentPage]);

  const handleAssign = async () => {
    if (!selectedPaper || !selectedReviewer) {
      addToast(t('chair.assignments.selectPaperAndReviewer'), "warning");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/assignments", {
        paperId: selectedPaper.id,
        reviewerId: parseInt(selectedReviewer),
      });

      addToast(t('chair.assignments.assignSuccess'), "success");
      setShowAssignModal(false);
      setSelectedPaper(null);
      setSelectedReviewer("");
      setAiSuggestions(null); // Reset AI suggestions

      // Reload assignments
      const assignRes = await apiClient.get(
        `/assignments/paper/${selectedPaper.id}`
      );
      setAssignments({
        ...assignments,
        [selectedPaper.id]: assignRes.data || [],
      });
    } catch (err) {
      console.error("Assignment error:", err);

      let errorMsg = t('chair.assignments.assignFailed');

      if (err.response) {
        // Backend trả về error message trực tiếp trong response.data (string)
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.status === 403) {
          errorMsg = t('chair.assignments.noPermission');
        } else if (err.response.status === 401) {
          errorMsg = t('chair.assignments.sessionExpired');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      addToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!selectedPaper) return;

    setLoadingAI(true);
    try {
      // Lấy danh sách reviewer chưa được phân công
      const paperAssignments = assignments[selectedPaper.id] || [];
      const availableReviewers = reviewers.filter((reviewer) => {
        return !paperAssignments.some(
          (assign) => assign.reviewer?.id === reviewer.id
        );
      });

      if (availableReviewers.length === 0) {
        addToast(t('chair.assignments.noAvailableReviewers'), "warning");
        setLoadingAI(false);
        return;
      }

      // Lấy conference ID với nhiều fallback
      const conferenceId = selectedPaper.conference?.id || 
                          selectedPaper.conferenceId || 
                          selectedPaper.track?.conference?.id || 
                          (selectedConference !== "ALL" ? selectedConference : null);

      // Debug log
      console.log('=== AI Suggestion Debug ===');
      console.log('Selected Paper:', selectedPaper);
      console.log('Conference ID:', conferenceId);
      console.log('Selected Conference:', selectedConference);
      console.log('Available Reviewers:', availableReviewers.length);

      if (!conferenceId) {
        addToast("Không tìm thấy ID hội nghị. Vui lòng chọn hội nghị cụ thể.", "error");
        setLoadingAI(false);
        return;
      }

      const response = await apiClient.post("/ai/suggest-reviewers-for-paper", {
        paperId: selectedPaper.id,
        paperTitle: selectedPaper.title,
        paperAbstract: selectedPaper.paperAbstract || selectedPaper.abstract || "",
        paperKeywords: selectedPaper.keywords || [],
        availableReviewers: availableReviewers.map(r => ({
          id: r.id,
          name: r.fullName,
          email: r.email,
          expertise: r.expertise || [r.affiliation || ""].filter(Boolean),
          keywords: r.keywords || (r.bio ? [r.bio] : [])
        })),
        conferenceId: conferenceId
      });

      setAiSuggestions(response.data);
    } catch (err) {
      console.error("AI suggestion error:", err);
      addToast(t('chair.assignments.aiSuggestError') + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleBulkAssign = async (paperIds, reviewerIds) => {
    if (
      !confirm(
        `Bạn có chắc muốn phân công ${reviewerIds.length} reviewer cho ${paperIds.length} bài báo?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/assignments/bulk", {
        paperIds: paperIds,
        reviewerIds: reviewerIds,
      });
      addToast(t('chair.assignments.bulkAssignSuccess'), "success");
      // Reload
      window.location.reload();
    } catch (err) {
      addToast("Lỗi: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: t('chair.assignments.statusPending'), className: "badge-warning" },
      ACCEPTED: { text: t('chair.assignments.statusAccepted'), className: "badge-success" },
      DECLINED: { text: t('chair.assignments.statusDeclined'), className: "badge-danger" },
      COMPLETED: { text: t('chair.assignments.statusCompleted'), className: "badge-info" },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.className}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>{badge.text}</span>;
  };

  const getPaperStatusBadge = (status) => {
    const badges = {
      SUBMITTED: { text: t('chair.assignments.paperSubmitted'), className: "badge-info" },
      UNDER_REVIEW: { text: t('chair.assignments.paperUnderReview'), className: "badge-warning" },
      ACCEPTED: { text: t('chair.assignments.paperAccepted'), className: "badge-success" },
      REJECTED: { text: t('chair.assignments.paperRejected'), className: "badge-danger" },
      WITHDRAWN: { text: t('chair.assignments.paperWithdrawn'), className: "badge-secondary" },
    };
    const badge = badges[status] || { text: status, className: "badge-info" };
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.assignments.title')}>
        <TableSkeleton rows={8} columns={7} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.assignments.title')}
      subtitle={t('chair.assignments.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">{t('chair.assignments.pageTitle')}</h2>
          <p className="data-page-subtitle">
            {t('chair.assignments.pageSubtitle')}
          </p>
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
                {t('chair.assignments.selectConference')}
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
                {t('chair.assignments.search')}
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
                  placeholder={t('chair.assignments.searchPlaceholder')}
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
              <span>{t('chair.assignments.filter')}</span>
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                {t('chair.assignments.all')}
                <span className="filter-count">{papers.length}</span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'UNASSIGNED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('UNASSIGNED')}
              >
                {t('chair.assignments.unassigned')}
                <span className="filter-count">
                  {papers.filter(p =>
                    (!assignments[p.id] || assignments[p.id].length === 0) &&
                    (p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW')
                  ).length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'UNDER_REVIEW' ? 'active' : ''}`}
                onClick={() => setStatusFilter('UNDER_REVIEW')}
              >
                {t('chair.assignments.underReview')}
                <span className="filter-count">
                  {papers.filter(p => p.status === 'UNDER_REVIEW').length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'WITHDRAWN' ? 'active' : ''}`}
                onClick={() => setStatusFilter('WITHDRAWN')}
              >
                {t('chair.assignments.withdrawn')}
                <span className="filter-count">
                  {papers.filter(p => p.status === 'WITHDRAWN').length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                {t('chair.assignments.completed')}
                <span className="filter-count">
                  {papers.filter(p => p.status === 'ACCEPTED' || p.status === 'REJECTED').length}
                </span>
              </button>
            </div>
          </div>

          <div className="sort-section">
            <div className="sort-label">
              <FiTrendingUp />
              <span>{t('chair.assignments.sort')}</span>
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t('chair.assignments.newest')}</option>
              <option value="oldest">{t('chair.assignments.oldest')}</option>
              <option value="unassigned">{t('chair.assignments.unassignedFirst')}</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#ffebee",
            border: "1px solid #d32f2f",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      <div className="table-wrapper">
        {papers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            {t('chair.assignments.noPapers')}
          </div>
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>{t('chair.assignments.paperTitle')}</th>
                <th>{t('chair.assignments.track')}</th>
                <th>{t('chair.assignments.author')}</th>
                <th>{t('chair.assignments.paperStatus')}</th>
                <th>{t('chair.assignments.reviewers')}</th>
                <th>{t('chair.assignments.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((paper) => {
                const paperAssignments = assignments[paper.id] || [];
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
                          {paper.conference.name}
                        </div>
                      )}
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>{getPaperStatusBadge(paper.status)}</td>
                    <td>
                      {paperAssignments.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {paperAssignments.map((assign) => (
                            <div
                              key={assign.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.875rem" }}>
                                {assign.reviewer?.fullName}
                              </span>
                              {getStatusBadge(assign.status)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#999", fontSize: "0.875rem" }}>{t('chair.assignments.notAssigned')}</span>
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        {/* Chỉ cho phân công nếu bài chưa bị REJECTED, WITHDRAWN, hoặc ACCEPTED */}
                        {(paper.status === 'SUBMITTED' || paper.status === 'UNDER_REVIEW') ? (
                          <button
                            className="btn-primary table-action"
                            onClick={() => {
                              setSelectedPaper(paper);
                              setShowAssignModal(true);
                            }}
                            style={{ minWidth: "140px" }}
                            title={
                              paperAssignments.length > 0
                                ? t('chair.assignments.addReviewer')
                                : t('chair.assignments.assign')
                            }
                          >
                            {paperAssignments.length > 0 ? t('chair.assignments.addReviewer') : t('chair.assignments.assign')}
                          </button>
                        ) : (
                          <span
                            className={`badge ${paper.status === 'ACCEPTED' ? 'badge-success' :
                                paper.status === 'REJECTED' ? 'badge-danger' :
                                  'badge-secondary'
                              }`}
                            style={{ minWidth: "140px", display: "inline-block", textAlign: "center" }}
                          >
                            {paper.status === 'ACCEPTED' && t('chair.assignments.accepted')}
                            {paper.status === 'REJECTED' && t('chair.assignments.rejected')}
                            {paper.status === 'WITHDRAWN' && t('chair.assignments.paperWithdrawn')}
                          </span>
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

      {/* Modal phân công */}
      {showAssignModal && selectedPaper && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAssignModal(false);
            setAiSuggestions(null);
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            <h3>{t('chair.assignments.assignReviewerFor')} {selectedPaper.title}</h3>

            {/* Hiển thị các reviewer đã được phân công */}
            {(() => {
              const paperAssignments = assignments[selectedPaper.id] || [];
              if (paperAssignments.length > 0) {
                return (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f0f0', borderRadius: '4px' }}>
                    <strong>{t('chair.assignments.alreadyAssigned')}</strong>
                    {paperAssignments.map((assign) => (
                      <div key={assign.id} style={{ marginTop: '0.25rem' }}>
                        • {assign.reviewer?.fullName} - {getStatusBadge(assign.status).props.children}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}

            {/* AI Suggestions Button */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={handleGetAISuggestions}
                disabled={loadingAI}
                style={{
                  padding: "0.625rem 1rem",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: loadingAI ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                {loadingAI ? (
                  <>
                    <span>⏳</span>
                    <span>{t('chair.assignments.aiAnalyzing')}</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>{t('chair.assignments.aiSuggestButton')}</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Suggestions Results */}
            {aiSuggestions && aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '2px solid #bfdbfe'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🤖</span>
                  <span>{t('chair.assignments.aiSuggestTitle')}</span>
                </div>
                {aiSuggestions.suggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.reviewerId}
                    onClick={() => setSelectedReviewer(suggestion.reviewerId.toString())}
                    style={{
                      padding: '0.75rem',
                      background: selectedReviewer === suggestion.reviewerId.toString() ? '#dbeafe' : 'white',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: selectedReviewer === suggestion.reviewerId.toString() ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: idx === 0 ? '#059669' : idx === 1 ? '#0891b2' : '#6b7280'
                        }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1f2937' }}>
                          {suggestion.reviewerName}
                        </span>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: suggestion.similarityScore >= 0.7 ? '#d1fae5' :
                          suggestion.similarityScore >= 0.5 ? '#fef3c7' : '#fee2e2',
                        color: suggestion.similarityScore >= 0.7 ? '#065f46' :
                          suggestion.similarityScore >= 0.5 ? '#92400e' : '#991b1b',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {(suggestion.similarityScore * 100).toFixed(0)}% {t('chair.assignments.similarity')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontStyle: 'italic' }}>
                      {suggestion.rationale}
                    </div>
                  </div>
                ))}
                {aiSuggestions.explanation && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: '#fffbeb',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    color: '#92400e',
                    border: '1px solid #fcd34d'
                  }}>
                    <strong>💡 {t('chair.assignments.aiNote')}</strong> {aiSuggestions.explanation}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('chair.assignments.selectReviewer')}</label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="form-input"
              >
                <option value="">{t('chair.assignments.selectReviewerPlaceholder')}</option>
                {reviewers
                  .filter((reviewer) => {
                    // Lọc ra những reviewer chưa được phân công cho bài này
                    const paperAssignments = assignments[selectedPaper.id] || [];
                    return !paperAssignments.some(
                      (assign) => assign.reviewer?.id === reviewer.id
                    );
                  })
                  .map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.fullName} ({reviewer.email})
                    </option>
                  ))}
              </select>
              {reviewers.filter((reviewer) => {
                const paperAssignments = assignments[selectedPaper.id] || [];
                return !paperAssignments.some(
                  (assign) => assign.reviewer?.id === reviewer.id
                );
              }).length === 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                            <span>{t('chair.assignments.allReviewersAssigned')}</span>
                  </div>
                )}
            </div>
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={submitting || !selectedReviewer}
              >
                {submitting ? t('chair.assignments.assigning') : t('chair.assignments.assignBtn')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPaper(null);
                  setSelectedReviewer("");
                  setAiSuggestions(null);
                }}
              >
                {t('chair.assignments.cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ChairAssignmentManagement;
