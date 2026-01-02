// src/pages/reviewer/ReviewerAssignments.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PaperSynopsisModal from "../../components/PaperSynopsisModal";
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
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [synopsisModal, setSynopsisModal] = useState({ show: false, paper: null });

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const currentUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}"
        );
        const reviewerId = currentUser.id;

        if (!reviewerId) {
          setError("Không tìm thấy thông tin reviewer");
          return;
        }

        const res = await apiClient.get(
          `/assignments/my-assignments?reviewerId=${reviewerId}`
        );
        setAssignments(res.data || []);
      } catch (err) {
        console.error("Load assignments error:", err);
        setError("Không thể tải danh sách bài được phân công.");
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  const handleAccept = async (assignmentId) => {
    try {
      await apiClient.put(`/assignments/${assignmentId}/accept`);
      setAssignments(
        assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "ACCEPTED" } : a
        )
      );
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDecline = async (assignmentId) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối assignment này?")) return;

    try {
      await apiClient.put(`/assignments/${assignmentId}/decline`);
      setAssignments(
        assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "DECLINED" } : a
        )
      );
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa đặt";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { 
        text: "Chờ xác nhận", 
        className: "status-badge status-pending",
        icon: <FiClock />
      },
      ACCEPTED: { 
        text: "Đã chấp nhận", 
        className: "status-badge status-accepted",
        icon: <FiCheckCircle />
      },
      DECLINED: { 
        text: "Đã từ chối", 
        className: "status-badge status-declined",
        icon: <FiXCircle />
      },
      COMPLETED: { 
        text: "Đã hoàn thành", 
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

  // Filter và Sort logic
  const getFilteredAndSortedAssignments = () => {
    let filtered = assignments;
    
    // Filter theo status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.assignedDate) - new Date(a.assignedDate);
      } else if (sortBy === "DEADLINE") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });
    
    return sorted;
  };

  const filteredAssignments = getFilteredAndSortedAssignments();

  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Bài được phân công">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Bài được phân công">
        <div style={{ color: "#d32f2f", padding: "1rem" }}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Bài được phân công"
    >
      <div className="assignments-header">
        <div className="assignments-header-content">
          <div className="assignments-breadcrumb">
            <span className="breadcrumb-item">Reviewer</span>
          </div>
          <h2 className="assignments-title">Bài được phân công</h2>
        </div>
        
        <div className="assignments-stats">
          <div className="stat-item">
            <span className="stat-number">{assignments.length}</span>
            <span className="stat-label">Tổng số bài</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'PENDING').length}
            </span>
            <span className="stat-label">Chờ xác nhận</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'ACCEPTED').length}
            </span>
            <span className="stat-label">Đang review</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {assignments.filter(a => a.status === 'COMPLETED').length}
            </span>
            <span className="stat-label">Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Filter và Sort Controls */}
      <div className="filter-sort-controls">
        <div className="filter-section">
          <div className="filter-label">
            <FiFilter />
            <span>Lọc:</span>
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả
              <span className="filter-count">{assignments.length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              Chờ xác nhận
              <span className="filter-count">{assignments.filter(a => a.status === 'PENDING').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'ACCEPTED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ACCEPTED')}
            >
              Đang review
              <span className="filter-count">{assignments.filter(a => a.status === 'ACCEPTED').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('COMPLETED')}
            >
              Hoàn thành
              <span className="filter-count">{assignments.filter(a => a.status === 'COMPLETED').length}</span>
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'DECLINED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('DECLINED')}
            >
              Đã từ chối
              <span className="filter-count">{assignments.filter(a => a.status === 'DECLINED').length}</span>
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
            <option value="NEWEST">Mới phân công nhất</option>
            <option value="DEADLINE">Deadline gần nhất</option>
          </select>
        </div>
      </div>

      <div className="assignments-content">
        {filteredAssignments.length === 0 ? (
          <div className="assignments-empty">
            <FiFileText className="empty-icon" />
            <h3>{assignments.length === 0 ? 'Chưa có bài phân công' : 'Không có kết quả phù hợp'}</h3>
            <p>{assignments.length === 0 ? 'Bạn chưa có bài nào được phân công phản biện.' : 'Thử thay đổi bộ lọc để xem thêm.'}</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-card-header">
                  <div className="assignment-icon">
                    <FiFileText />
                  </div>
                  <div className="assignment-header-content">
                    <h3 className="assignment-title">
                      {assignment.paper?.title || "N/A"}
                    </h3>
                  </div>
                </div>

                <div className="assignment-card-body">
                  <div className="assignment-dates">
                    <div className="date-item">
                      <FiCalendar className="date-icon" />
                      <div className="date-content">
                        <span className="date-label">Ngày phân công</span>
                        <span className="date-value">
                          {formatDate(assignment.assignedDate)}
                        </span>
                      </div>
                    </div>
                    <div className="date-item">
                      <FiClock className="date-icon deadline" />
                      <div className="date-content">
                        <span className="date-label">Hạn chấm</span>
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
                        <span>Chấp nhận</span>
                      </button>
                      <button
                        className="assignment-btn btn-decline"
                        onClick={() => handleDecline(assignment.id)}
                      >
                        <FiXCircle />
                        <span>Từ chối</span>
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
                        <span>Chấm bài</span>
                      </Link>
                      <Link
                        to={`/reviewer/discussions?paperId=${assignment.paper?.id}`}
                        className="assignment-btn btn-discussion"
                      >
                        <FiMessageSquare />
                        <span>Thảo luận</span>
                      </Link>
                    </>
                  )}
                  {assignment.status === "COMPLETED" && (
                    <Link
                      to={`/reviewer/review/${assignment.id}`}
                      className="assignment-btn btn-view"
                    >
                      <FiEye />
                      <span>Xem review</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paper Synopsis Modal */}
      {synopsisModal.show && (
        <PaperSynopsisModal
          paper={synopsisModal.paper}
          onClose={() => setSynopsisModal({ show: false, paper: null })}
        />
      )}
    </DashboardLayout>
  );
};

export default ReviewerAssignments;
