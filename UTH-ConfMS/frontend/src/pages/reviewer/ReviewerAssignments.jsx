// src/pages/reviewer/ReviewerAssignments.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PaperSynopsisModal from "../../components/PaperSynopsisModal";
import Pagination from "../../components/Pagination";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { usePagination } from "../../hooks/usePagination";
import { ToastContainer } from "../../components/Toast";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiMessageSquare,
  FiEye,
  FiCalendar,
  FiTag,
  FiFilter,
  FiTrendingUp
} from "react-icons/fi";
import "../../styles/ReviewerAssignments.css";

const ReviewerAssignments = () => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [synopsisModal, setSynopsisModal] = useState({ show: false, paper: null });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filteredAssignments, 12);

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  // Load assignments
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const currentUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}"
        );
        const reviewerId = currentUser.id;

        if (!reviewerId) {
          setError(t('reviewer.assignments.reviewerNotFound'));
          return;
        }

        const res = await apiClient.get(
          `/assignments/my-assignments?reviewerId=${reviewerId}`
        );
        
        // Add conferenceId to each paper for AI features
        const assignmentsData = (res.data || []).map(assignment => {
          if (assignment.paper && assignment.paper.track) {
            assignment.paper.conferenceId = assignment.paper.track.conferenceId;
          }
          return assignment;
        });
        
        setAssignments(assignmentsData);
      } catch (err) {
        console.error("Load assignments error:", err);
        setError(t('reviewer.assignments.loadError'));
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = assignments;

    // Filter by conference
    if (selectedConference !== "ALL") {
      result = result.filter(a => 
        a.paper?.track?.conferenceId === parseInt(selectedConference)
      );
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      result = result.filter(a => a.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.paper?.title?.toLowerCase().includes(query) ||
        a.paper?.track?.name?.toLowerCase().includes(query) ||
        a.paper?.mainAuthor?.fullName?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "NEWEST") {
      result.sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));
    } else if (sortBy === "DEADLINE") {
      result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    setFilteredAssignments(result);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [assignments, selectedConference, filterStatus, searchQuery, sortBy, setCurrentPage]);

  const handleAccept = async (assignmentId) => {
    try {
      await apiClient.put(`/assignments/${assignmentId}/accept`);
      setAssignments(
        assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "ACCEPTED" } : a
        )
      );
    } catch (err) {
      addToast(t('app.error') + ": " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleDecline = async (assignmentId) => {
    if (!confirm(t('reviewer.assignments.confirmDecline'))) return;

    try {
      await apiClient.put(`/assignments/${assignmentId}/decline`);
      setAssignments(
        assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "DECLINED" } : a
        )
      );
    } catch (err) {
      addToast(t('app.error') + ": " + (err.response?.data?.message || err.message), "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('reviewer.assignments.notSet');
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { 
        text: t('reviewer.assignments.statusPending'), 
        className: "status-badge status-pending",
        icon: <FiClock />
      },
      ACCEPTED: { 
        text: t('reviewer.assignments.statusAccepted'), 
        className: "status-badge status-accepted",
        icon: <FiCheckCircle />
      },
      DECLINED: { 
        text: t('reviewer.assignments.statusDeclined'), 
        className: "status-badge status-declined",
        icon: <FiXCircle />
      },
      COMPLETED: { 
        text: t('reviewer.assignments.statusCompleted'), 
        className: "status-badge status-completed",
        icon: <FiCheckCircle />
      },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={badge.className}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };



  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title={t('reviewer.assignments.title')}>
        <CardSkeleton count={6} />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title={t('reviewer.assignments.title')}>
        <div style={{ color: "#d32f2f", padding: "1rem" }}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title={t('reviewer.assignments.title')}
    >
      <div className="assignments-header">
        <div className="assignments-header-content">
          <div className="assignments-breadcrumb">
            <span className="breadcrumb-item">{t('roles.reviewer')}</span>
          </div>
          <h2 className="assignments-title">{t('reviewer.assignments.title')}</h2>
        </div>
        
        <div className="assignments-stats">
          <div className="stat-item">
            <span className="stat-number">{assignments.length}</span>
            <span className="stat-label">{t('reviewer.assignments.totalPapers')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'PENDING').length}
            </span>
            <span className="stat-label">{t('reviewer.assignments.pendingCount')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'ACCEPTED').length}
            </span>
            <span className="stat-label">{t('reviewer.assignments.reviewingCount')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'COMPLETED').length}
            </span>
            <span className="stat-label">{t('reviewer.assignments.completedCount')}</span>
          </div>
        </div>
      </div>

      {/* Conference & Search Filter */}
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
                {t('reviewer.assignments.selectConference')}:
              </label>
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
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
                <option value="ALL">{t('reviewer.assignments.allConferences')}</option>
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
                {t('reviewer.assignments.search')}:
              </label>
              <div style={{ position: "relative" }}>
                <FiFilter style={{
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
                  placeholder={t('reviewer.assignments.searchPlaceholder')}
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

      {/* Filter và Sort Controls */}
      <div className="filter-sort-controls">
        <div className="filter-section">
          <div className="filter-label">
            <FiFilter />
            <span>{t('reviewer.assignments.filterLabel')}</span>
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              {t('reviewer.assignments.filterAll')}
              <span className="filter-count">{filteredAssignments.length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              {t('reviewer.assignments.statusPending')}
              <span className="filter-count">{filteredAssignments.filter(a => a.status === 'PENDING').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'ACCEPTED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ACCEPTED')}
            >
              {t('reviewer.assignments.filterReviewing')}
              <span className="filter-count">{filteredAssignments.filter(a => a.status === 'ACCEPTED').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('COMPLETED')}
            >
              {t('reviewer.assignments.filterCompleted')}
              <span className="filter-count">{filteredAssignments.filter(a => a.status === 'COMPLETED').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'DECLINED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('DECLINED')}
            >
              {t('reviewer.assignments.statusDeclined')}
              <span className="filter-count">{filteredAssignments.filter(a => a.status === 'DECLINED').length}</span>
            </button>
          </div>
        </div>
        
        <div className="sort-section">
          <div className="sort-label">
            <FiTrendingUp />
            <span>{t('reviewer.assignments.sortLabel')}</span>
          </div>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="NEWEST">{t('reviewer.assignments.sortNewest')}</option>
            <option value="DEADLINE">{t('reviewer.assignments.sortDeadline')}</option>
          </select>
        </div>
      </div>

      <div className="assignments-content">
        {filteredAssignments.length === 0 ? (
          <div className="assignments-empty">
            <FiFileText className="empty-icon" />
            <h3>{assignments.length === 0 ? t('reviewer.assignments.noAssignments') : t('reviewer.assignments.noMatchingResults')}</h3>
            <p>{assignments.length === 0 ? t('reviewer.assignments.noAssignmentsDesc') : t('reviewer.assignments.noMatchingResultsDesc')}</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {paginatedItems.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-card-header">
                  <div className="assignment-icon">
                    <FiFileText />
                  </div>
                  <div className="assignment-header-content">
                    <h3 className="assignment-title">
                      {assignment.paper?.title || "N/A"}
                    </h3>
                    {selectedConference === "ALL" && assignment.paper?.track?.conference && (
                      <div style={{ 
                        fontSize: "0.75rem", 
                        color: "#6b7280", 
                        marginTop: "0.25rem",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem"
                      }}>
                        🏛️ {conferences.find(c => c.id === assignment.paper.track.conferenceId)?.name || "N/A"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="assignment-card-body">
                  <div className="assignment-dates">
                    <div className="date-item">
                      <FiCalendar className="date-icon" />
                      <div className="date-content">
                        <span className="date-label">{t('reviewer.assignments.assignedDate')}</span>
                        <span className="date-value">
                          {formatDate(assignment.assignedDate)}
                        </span>
                      </div>
                    </div>
                    <div className="date-item">
                      <FiClock className="date-icon deadline" />
                      <div className="date-content">
                        <span className="date-label">{t('reviewer.assignments.dueDate')}</span>
                        <span className="date-value deadline">
                          {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="assignment-status-row">
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>

                <div className="assignment-card-footer">
                  {assignment.status === "PENDING" && (
                    <>
                      <button
                        className="assignment-btn btn-accept"
                        onClick={() => handleAccept(assignment.id)}
                      >
                        <FiCheckCircle />
                        <span>{t('reviewer.assignments.acceptBtn')}</span>
                      </button>
                      <button
                        className="assignment-btn btn-decline"
                        onClick={() => handleDecline(assignment.id)}
                      >
                        <FiXCircle />
                        <span>{t('reviewer.assignments.declineBtn')}</span>
                      </button>
                    </>
                  )}
                  {assignment.status === "ACCEPTED" && (
                    <>
                      <Link
                        to={`/reviewer/review/${assignment.id}`}
                        className="assignment-btn btn-primary"
                      >
                        <FiFileText />
                        <span>{t('reviewer.assignments.reviewBtn')}</span>
                      </Link>
                      <Link
                        to={`/reviewer/discussions?paperId=${assignment.paper?.id}`}
                        className="assignment-btn btn-discussion"
                      >
                        <FiMessageSquare />
                        <span>{t('reviewer.assignments.discussionBtn')}</span>
                      </Link>
                    </>
                  )}
                  {assignment.status === "COMPLETED" && (
                    <Link
                      to={`/reviewer/review/${assignment.id}`}
                      className="assignment-btn btn-view"
                    >
                      <FiEye />
                      <span>{t('reviewer.assignments.viewReviewBtn')}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredAssignments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAssignments.length}
          itemsPerPage={12}
          onPageChange={setCurrentPage}
          itemName={t('reviewer.assignments.assignmentsLabel')}
        />
      )}

      {/* Paper Synopsis Modal */}
      {synopsisModal.show && (
        <PaperSynopsisModal
          paper={synopsisModal.paper}
          onClose={() => setSynopsisModal({ show: false, paper: null })}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ReviewerAssignments;
