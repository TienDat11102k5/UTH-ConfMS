// src/pages/chair/ChairAssignmentManagement.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { FiFilter, FiTrendingUp, FiSearch } from "react-icons/fi";
import "../../styles/ReviewerAssignments.css";

const ChairAssignmentManagement = () => {
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
              const confPapers = papersRes.data || [];
              allPapers = [...allPapers, ...confPapers];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          // Load papers của conference cụ thể
          console.log("Loading papers for conference:", selectedConference);
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          allPapers = papersRes.data || [];
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
          setError(
            "Không thể tải danh sách reviewers: " +
            (uErr.response?.data || uErr.message)
          );
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
        setError("Không thể tải dữ liệu.");
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
      alert("Vui lòng chọn bài báo và reviewer!");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/assignments", {
        paperId: selectedPaper.id,
        reviewerId: parseInt(selectedReviewer),
      });

      alert("Phân công thành công!");
      setShowAssignModal(false);
      setSelectedPaper(null);
      setSelectedReviewer("");

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

      let errorMsg = "Phân công thất bại";

      if (err.response) {
        // Backend trả về error message trực tiếp trong response.data (string)
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.status === 403) {
          errorMsg = "Bạn không có quyền thực hiện thao tác này.";
        } else if (err.response.status === 401) {
          errorMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(errorMsg);
    } finally {
      setSubmitting(false);
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
      alert("Phân công hàng loạt thành công!");
      // Reload
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: "Chờ xác nhận", className: "badge-warning" },
      ACCEPTED: { text: "Đang chấm", className: "badge-success" },
      DECLINED: { text: "Từ chối", className: "badge-danger" },
      COMPLETED: { text: "Hoàn thành", className: "badge-info" },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.className}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>{badge.text}</span>;
  };

  const getPaperStatusBadge = (status) => {
    const badges = {
      SUBMITTED: { text: "Đã nộp", className: "badge-info" },
      UNDER_REVIEW: { text: "Đang chấm", className: "badge-warning" },
      ACCEPTED: { text: "Chấp nhận", className: "badge-success" },
      REJECTED: { text: "Từ chối", className: "badge-danger" },
      WITHDRAWN: { text: "Đã rút", className: "badge-secondary" },
    };
    const badge = badges[status] || { text: status, className: "badge-info" };
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Quản lý Assignment">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Quản lý Assignment"
      subtitle="Phân công Reviewer/PC cho các bài báo"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Quản lý Assignment</h2>
          <p className="data-page-subtitle">
            Phân công reviewer cho từng bài báo, theo dõi trạng thái assignment
            và tiến độ review.
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
                  placeholder="Tìm theo tiêu đề, tác giả, track..."
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
                className={`filter-btn ${statusFilter === 'UNASSIGNED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('UNASSIGNED')}
              >
                Chưa phân công
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
                Đang review
                <span className="filter-count">
                  {papers.filter(p => p.status === 'UNDER_REVIEW').length}
                </span>
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'WITHDRAWN' ? 'active' : ''}`}
                onClick={() => setStatusFilter('WITHDRAWN')}
              >
                Đã rút
                <span className="filter-count">
                  {papers.filter(p => p.status === 'WITHDRAWN').length}
                </span>
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Hoàn thành
                <span className="filter-count">
                  {papers.filter(p => p.status === 'ACCEPTED' || p.status === 'REJECTED').length}
                </span>
              </button>
            </div>
          </div>
          
          <div className="sort-section">
            <div className="sort-label">
              <FiTrendingUp />
              <span>Sắp xếp:</span>
            </div>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="unassigned">Chưa phân công trước</option>
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
            Chưa có bài báo nào trong hội nghị này.
          </div>
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Chủ đề </th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Người chấm bài</th>
                <th>Thao tác</th>
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
                          🏛️ {paper.conference.name}
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
                        <span style={{ color: "#999", fontSize: "0.875rem" }}>Chưa phân công</span>
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
                                ? "Thêm reviewer cho bài này"
                                : "Phân công reviewer"
                            }
                          >
                            {paperAssignments.length > 0 ? "Thêm reviewer" : "Phân công"}
                          </button>
                        ) : (
                          <span 
                            className={`badge ${
                              paper.status === 'ACCEPTED' ? 'badge-success' : 
                              paper.status === 'REJECTED' ? 'badge-danger' : 
                              'badge-secondary'
                            }`}
                            style={{ minWidth: "140px", display: "inline-block", textAlign: "center" }}
                          >
                            {paper.status === 'ACCEPTED' && 'Đã chấp nhận'}
                            {paper.status === 'REJECTED' && 'Đã từ chối'}
                            {paper.status === 'WITHDRAWN' && 'Đã rút'}
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
          itemName="bài báo"
        />
      )}

      {/* Modal phân công */}
      {showAssignModal && selectedPaper && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Phân công Reviewer cho: {selectedPaper.title}</h3>

            {/* Hiển thị các reviewer đã được phân công */}
            {(() => {
              const paperAssignments = assignments[selectedPaper.id] || [];
              if (paperAssignments.length > 0) {
                return (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f0f0', borderRadius: '4px' }}>
                    <strong>Đã phân công:</strong>
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

            <div className="form-group">
              <label className="form-label">Chọn Reviewer *</label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="form-input"
              >
                <option value="">-- Chọn Reviewer --</option>
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
                    Tất cả reviewers đã được phân công cho bài này
                  </div>
                )}
            </div>
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={submitting || !selectedReviewer}
              >
                {submitting ? "Đang phân công..." : "Phân công"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPaper(null);
                  setSelectedReviewer("");
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairAssignmentManagement;
