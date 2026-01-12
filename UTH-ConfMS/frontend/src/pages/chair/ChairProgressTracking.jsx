// src/pages/chair/ChairProgressTracking.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import { usePagination } from "../../hooks/usePagination";
import { FiFilter, FiSearch, FiCheckCircle, FiClock, FiXCircle, FiAlertCircle } from "react-icons/fi";
import "../../styles/ReviewerAssignments.css";
import "../../styles/ChairProgressTracking.css";

const ChairProgressTracking = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalAssignments: 0,
    completedReviews: 0,
    pendingReviews: 0,
    acceptedPapers: 0,
    rejectedPapers: 0,
    underReviewPapers: 0,
    completionRate: 0
  });

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

  // Load data
  useEffect(() => {
    if (!selectedConference) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        let allPapers = [];

        if (selectedConference === "ALL") {
          for (const conf of conferences) {
            try {
              const papersRes = await apiClient.get(`/decisions/papers/${conf.id}`);
              allPapers = [...allPapers, ...(papersRes.data || [])];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          allPapers = papersRes.data || [];
        }

        setPapers(allPapers);

        // Load assignments and reviews for each paper
        const assignmentsMap = {};
        const reviewsMap = {};
        let totalAssignments = 0;
        let completedReviews = 0;

        for (const paper of allPapers) {
          try {
            const [assignRes, reviewsRes] = await Promise.all([
              apiClient.get(`/assignments/paper/${paper.id}`),
              apiClient.get(`/reviews/paper/${paper.id}`)
            ]);
            assignmentsMap[paper.id] = assignRes.data || [];
            reviewsMap[paper.id] = reviewsRes.data || [];

            totalAssignments += (assignRes.data || []).length;
            completedReviews += (reviewsRes.data || []).length;
          } catch (err) {
            assignmentsMap[paper.id] = [];
            reviewsMap[paper.id] = [];
          }
        }

        setAssignments(assignmentsMap);
        setReviews(reviewsMap);

        // Calculate statistics
        const accepted = allPapers.filter(p => p.status === 'ACCEPTED').length;
        const rejected = allPapers.filter(p => p.status === 'REJECTED').length;
        const underReview = allPapers.filter(p => p.status === 'UNDER_REVIEW').length;
        const completionRate = totalAssignments > 0 ? (completedReviews / totalAssignments) * 100 : 0;

        setStats({
          totalPapers: allPapers.length,
          totalAssignments,
          completedReviews,
          pendingReviews: totalAssignments - completedReviews,
          acceptedPapers: accepted,
          rejectedPapers: rejected,
          underReviewPapers: underReview,
          completionRate
        });
      } catch (err) {
        console.error("Load error:", err);
        setError("Không thể tải dữ liệu tiến độ.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedConference, conferences]);

  // Apply filters
  useEffect(() => {
    let result = papers;

    // Filter by status
    if (statusFilter === 'COMPLETED') {
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        const paperReviews = reviews[p.id] || [];
        return paperAssignments.length > 0 && paperReviews.length === paperAssignments.length;
      });
    } else if (statusFilter === 'PENDING') {
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        const paperReviews = reviews[p.id] || [];
        return paperAssignments.length > 0 && paperReviews.length < paperAssignments.length;
      });
    } else if (statusFilter === 'NO_ASSIGNMENT') {
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        return paperAssignments.length === 0;
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

    setFilteredPapers(result);
    setCurrentPage(1);
  }, [papers, statusFilter, searchQuery, assignments, reviews, setCurrentPage]);

  const getProgressPercentage = (paperId) => {
    const paperAssignments = assignments[paperId] || [];
    const paperReviews = reviews[paperId] || [];
    if (paperAssignments.length === 0) return 0;
    return (paperReviews.length / paperAssignments.length) * 100;
  };

  const getStatusBadge = (status) => {
    const badges = {
      SUBMITTED: { text: "Đã nộp", className: "badge badge-info" },
      UNDER_REVIEW: { text: "Đang chấm", className: "badge badge-warning" },
      ACCEPTED: { text: "Chấp nhận", className: "badge badge-success" },
      REJECTED: { text: "Từ chối", className: "badge badge-danger" },
      WITHDRAWN: { text: "Đã rút", className: "badge badge-secondary" },
    };
    const info = badges[status] || { text: status, className: "badge badge-secondary" };
    return <span className={info.className} style={{ minWidth: "90px", display: "inline-block", textAlign: "center" }}>{info.text}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Theo dõi tiến độ">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title="Theo dõi tiến độ"
      subtitle="Theo dõi tiến độ đánh giá và quyết định của hội nghị"
    >
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn-back"
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          ← Quay lại dashboard
        </button>
      </div>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Theo dõi tiến độ</h2>
          <p className="data-page-subtitle">
            Xem tổng quan tiến độ đánh giá và trạng thái quyết định của tất cả bài báo
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            Tổng số bài
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            {stats.totalPapers}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            Tỷ lệ hoàn thành
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            {stats.completionRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>
            {stats.completedReviews}/{stats.totalAssignments} reviews
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            Đã chấp nhận
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            {stats.acceptedPapers}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            Đã từ chối
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            {stats.rejectedPapers}
          </div>
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
                Chọn hội nghị:
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
                <option value="ALL">Tất cả hội nghị</option>
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
                Tìm kiếm:
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
                  placeholder="Tìm theo tiêu đề, tác giả, chủ đề..."
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

      {/* Filter Controls */}
      {papers.length > 0 && (
        <div className="filter-sort-controls">
          <div className="filter-section">
            <div className="filter-label">
              <FiFilter />
              <span>Lọc:</span>
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả
                <span className="filter-count">{papers.length}</span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Đã đủ đánh giá
                <span className="filter-count">
                  {papers.filter(p => {
                    const paperAssignments = assignments[p.id] || [];
                    const paperReviews = reviews[p.id] || [];
                    return paperAssignments.length > 0 && paperReviews.length === paperAssignments.length;
                  }).length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDING')}
              >
                Chưa đủ đánh giá
                <span className="filter-count">
                  {papers.filter(p => {
                    const paperAssignments = assignments[p.id] || [];
                    const paperReviews = reviews[p.id] || [];
                    return paperAssignments.length > 0 && paperReviews.length < paperAssignments.length;
                  }).length}
                </span>
              </button>
              <button
                className={`filter-btn ${statusFilter === 'NO_ASSIGNMENT' ? 'active' : ''}`}
                onClick={() => setStatusFilter('NO_ASSIGNMENT')}
              >
                Chưa phân công
                <span className="filter-count">
                  {papers.filter(p => (assignments[p.id] || []).length === 0).length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#ffebee",
          border: "1px solid #d32f2f",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#d32f2f",
        }}>
          {error}
        </div>
      )}

      <div className="table-wrapper">
        {papers.length === 0 ? (
          <EmptyState
            icon="file"
            title="Chưa có bài báo nào"
            description="Các bài báo sẽ hiển thị ở đây sau khi có submissions."
            size="large"
          />
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Chủ đề</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Tiến độ đánh giá</th>
                <th>Người chấm</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((paper) => {
                const paperAssignments = assignments[paper.id] || [];
                const paperReviews = reviews[paper.id] || [];
                const progress = getProgressPercentage(paper.id);

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
                    <td style={{ whiteSpace: "nowrap" }}>{getStatusBadge(paper.status)}</td>
                    <td>
                      <div style={{ minWidth: "150px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem"
                        }}>
                          <div style={{
                            flex: 1,
                            height: "8px",
                            background: "#e5e7eb",
                            borderRadius: "4px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              height: "100%",
                              background: progress === 100 ? "#10b981" : "#3b82f6",
                              width: `${progress}%`,
                              transition: "width 0.3s ease"
                            }} />
                          </div>
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: progress === 100 ? "#10b981" : "#6b7280",
                            minWidth: "40px"
                          }}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {paperReviews.length}/{paperAssignments.length} đánh giá
                        </div>
                      </div>
                    </td>
                    <td>
                      {paperAssignments.length === 0 ? (
                        <span style={{ color: "#999", fontSize: "0.875rem" }}>Chưa phân công</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {paperAssignments.map((assign) => {
                            const hasReview = paperReviews.some(r => r.reviewer?.id === assign.reviewer?.id);
                            return (
                              <div key={assign.id} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                fontSize: "0.8125rem"
                              }}>
                                {hasReview ? (
                                  <FiCheckCircle size={14} style={{ color: "#10b981" }} />
                                ) : assign.status === 'COMPLETED' ? (
                                  <FiCheckCircle size={14} style={{ color: "#10b981" }} />
                                ) : assign.status === 'ACCEPTED' ? (
                                  <FiClock size={14} style={{ color: "#f59e0b" }} />
                                ) : assign.status === 'DECLINED' ? (
                                  <FiXCircle size={14} style={{ color: "#ef4444" }} />
                                ) : (
                                  <FiAlertCircle size={14} style={{ color: "#94a3b8" }} />
                                )}
                                <span style={{ color: "#6b7280" }}>
                                  {assign.reviewer?.fullName || "N/A"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
          itemName="bài báo"
        />
      )}
    </DashboardLayout>
  );
};

export default ChairProgressTracking;
