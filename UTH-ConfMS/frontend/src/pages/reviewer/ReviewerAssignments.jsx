// src/pages/reviewer/ReviewerAssignments.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

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
      PENDING: { text: "Chờ xác nhận", className: "badge-warning" },
      ACCEPTED: { text: "Đã chấp nhận", className: "badge-success" },
      DECLINED: { text: "Đã từ chối", className: "badge-danger" },
      COMPLETED: { text: "Đã hoàn thành", className: "badge-info" },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
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
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Reviewer</span>
          </div>
          <h2 className="data-page-title">Bài được phân công</h2>
          <p className="data-page-subtitle">
            Xem và quản lý các bài báo bạn được phân công phản biện. Chấp nhận
            hoặc từ chối assignment, sau đó tiến hành review.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        {assignments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            Bạn chưa có bài nào được phân công.
          </div>
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Track</th>
                <th>Ngày phân công</th>
                <th>Hạn chấm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    <strong>{assignment.paper?.title || "N/A"}</strong>
                  </td>
                  <td>{assignment.paper?.track?.name || "N/A"}</td>
                  <td>{formatDate(assignment.assignedDate)}</td>
                  <td>{formatDate(assignment.dueDate)}</td>
                  <td>{getStatusBadge(assignment.status)}</td>
                  <td>
                    <div className="inline-actions">
                      {assignment.status === "PENDING" && (
                        <>
                          <button
                            className="btn-primary table-action"
                            onClick={() => handleAccept(assignment.id)}
                          >
                            Chấp nhận
                          </button>
                          <button
                            className="btn-secondary table-action"
                            style={{ color: "#d32f2f" }}
                            onClick={() => handleDecline(assignment.id)}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {assignment.status === "ACCEPTED" && (
                        <>
                          <Link
                            to={`/reviewer/review/${assignment.id}`}
                            className="btn-primary table-action"
                          >
                            Chấm bài
                          </Link>
                          <Link
                            to={`/reviewer/discussions?paperId=${assignment.paper?.id}`}
                            className="btn-secondary table-action"
                          >
                            Thảo luận
                          </Link>
                        </>
                      )}
                      {assignment.status === "COMPLETED" && (
                        <Link
                          to={`/reviewer/review/${assignment.id}`}
                          className="btn-secondary table-action"
                        >
                          Xem review
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewerAssignments;
