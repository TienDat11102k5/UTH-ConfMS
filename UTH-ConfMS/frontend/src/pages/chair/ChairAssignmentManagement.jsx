// src/pages/chair/ChairAssignmentManagement.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairAssignmentManagement = () => {
  const { conferenceId } = useParams();
  const [papers, setPapers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load papers của conference
        // Sửa: Gọi API cụ thể cho conference thay vì lấy toàn bộ (gây lỗi 403)
        const papersRes = await apiClient.get(
          `/decisions/papers/${conferenceId}`
        );
        const confPapers = papersRes.data || [];
        setPapers(confPapers);

        // Load reviewers
        try {
          const usersRes = await apiClient.get("/decisions/reviewers");
          const allUsers = usersRes.data || [];
          const reviewerUsers = allUsers.filter(
            (u) =>
              u.role === "REVIEWER" ||
              u.role === "PC" ||
              u.roles?.some((r) => r === "REVIEWER" || r === "PC")
          );
          setReviewers(reviewerUsers);
        } catch (uErr) {
          console.warn("Không thể tải danh sách reviewers:", uErr);
        }

        // Load assignments for each paper
        const assignmentsMap = {};
        for (const paper of confPapers) {
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
    if (conferenceId) loadData();
  }, [conferenceId]);

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
      alert("Lỗi: " + (err.response?.data?.message || err.message));
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
      ACCEPTED: { text: "Đã chấp nhận", className: "badge-success" },
      DECLINED: { text: "Đã từ chối", className: "badge-danger" },
      COMPLETED: { text: "Đã hoàn thành", className: "badge-info" },
    };
    const badge = badges[status] || badges.PENDING;
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
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Track</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Reviewers đã phân công</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => {
                const paperAssignments = assignments[paper.id] || [];
                return (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <strong>{paper.title}</strong>
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          paper.status === "ACCEPTED"
                            ? "success"
                            : paper.status === "REJECTED"
                            ? "danger"
                            : "info"
                        }`}
                      >
                        {paper.status}
                      </span>
                    </td>
                    <td>
                      {paperAssignments.length > 0 ? (
                        <div>
                          {paperAssignments.map((assign) => (
                            <div
                              key={assign.id}
                              style={{ marginBottom: "0.25rem" }}
                            >
                              {assign.reviewer?.fullName}{" "}
                              {getStatusBadge(assign.status)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#999" }}>Chưa phân công</span>
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="btn-primary table-action"
                          onClick={() => {
                            setSelectedPaper(paper);
                            setShowAssignModal(true);
                          }}
                        >
                          Phân công
                        </button>
                        <button
                          className="btn-secondary table-action"
                          onClick={() => {
                            // View details
                            window.open(
                              `/conferences/${conferenceId}`,
                              "_blank"
                            );
                          }}
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal phân công */}
      {showAssignModal && selectedPaper && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Phân công Reviewer cho: {selectedPaper.title}</h3>
            <div className="form-group">
              <label className="form-label">Chọn Reviewer *</label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="form-input"
              >
                <option value="">-- Chọn Reviewer --</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.fullName} ({reviewer.email})
                  </option>
                ))}
              </select>
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
