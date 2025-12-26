// src/pages/reviewer/ReviewerAssignments.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiMessageSquare,
  FiEye,
  FiCalendar,
  FiTag
} from "react-icons/fi";
import "../../styles/ReviewerAssignments.css";

const ReviewerAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      subtitle="Danh sách các bài báo bạn được phân công phản biện"
    >
      <div className="assignments-header">
        <div className="assignments-header-content">
          <div className="assignments-breadcrumb">
            <span className="breadcrumb-item">Reviewer</span>
          </div>
          <h2 className="assignments-title">Bài được phân công</h2>
          <p className="assignments-subtitle">
            Xem và quản lý các bài báo bạn được phân công phản biện. Chấp nhận
            hoặc từ chối assignment, sau đó tiến hành review.
          </p>
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

      <div className="assignments-content">
        {assignments.length === 0 ? (
          <div className="assignments-empty">
            <FiFileText className="empty-icon" />
            <h3>Chưa có bài phân công</h3>
            <p>Bạn chưa có bài nào được phân công phản biện.</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-card-header">
                  <div className="assignment-icon">
                    <FiFileText />
                  </div>
                  <div className="assignment-header-content">
                    <h3 className="assignment-title">
                      {assignment.paper?.title || "N/A"}
                    </h3>
                    <div className="assignment-meta">
                      <span className="meta-item">
                        <FiTag />
                        {assignment.paper?.track?.name || "N/A"}
                      </span>
                    </div>
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
                        Chấp nhận
                      </button>
                      <button
                        className="assignment-btn btn-decline"
                        onClick={() => handleDecline(assignment.id)}
                      >
                        <FiXCircle />
                        Từ chối
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
                        Chấm bài
                      </Link>
                      <Link
                        to={`/reviewer/discussions?paperId=${assignment.paper?.id}`}
                        className="assignment-btn btn-discussion"
                      >
                        <FiMessageSquare />
                        Thảo luận
                      </Link>
                    </>
                  )}
                  {assignment.status === "COMPLETED" && (
                    <Link
                      to={`/reviewer/review/${assignment.id}`}
                      className="assignment-btn btn-view"
                    >
                      <FiEye />
                      Xem review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewerAssignments;
