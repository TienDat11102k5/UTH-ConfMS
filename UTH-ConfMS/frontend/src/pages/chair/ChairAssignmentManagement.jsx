// src/pages/chair/ChairAssignmentManagement.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairAssignmentManagement = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [papers, setPapers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedConference(res.data[0].id);
        }
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

        // Load papers của conference
        console.log("Loading papers for conference:", selectedConference);
        const papersRes = await apiClient.get(
          `/decisions/papers/${selectedConference}`
        );
        console.log("Papers response:", papersRes.data);
        const confPapers = papersRes.data || [];
        setPapers(confPapers);

        // Load reviewers
        try {
          console.log("Loading reviewers...");
          const usersRes = await apiClient.get("/decisions/reviewers");
          console.log("Reviewers response:", usersRes.data);
          const allUsers = usersRes.data || [];
          // Backend đã lọc rồi, không cần filter nữa
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
    loadData();
  }, [selectedConference]);

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
      // Log chi tiết lỗi để debug
      console.error("Assignment error:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Status:", err.response.status);
        console.error("Headers:", err.response.headers);
      }
      
      let errorMsg = "Lỗi không xác định";
      if (err.response?.status === 403) {
        errorMsg = "Bạn không có quyền thực hiện thao tác này. Hãy đảm bảo bạn đã đăng nhập với tài khoản CHAIR hoặc ADMIN.";
      } else if (err.response?.status === 401) {
        errorMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
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
      ACCEPTED: { text: "Đã chấp nhận", className: "badge-success" },
      DECLINED: { text: "Đã từ chối", className: "badge-danger" },
      COMPLETED: { text: "Đã hoàn thành", className: "badge-info" },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };

  const getPaperStatusBadge = (status) => {
    const badges = {
      SUBMITTED: { text: "Đã nộp", className: "badge-info" },
      UNDER_REVIEW: { text: "Đang review", className: "badge-warning" },
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
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <label style={{ marginRight: "1rem", fontWeight: "bold" }}>
            Chọn hội nghị:
          </label>
          <select
            value={selectedConference || ""}
            onChange={(e) => setSelectedConference(parseInt(e.target.value))}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              minWidth: "300px",
            }}
          >
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
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
                <th>Track</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Reviewers</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => {
                const paperAssignments = assignments[paper.id] || [];
                return (
                  <tr key={paper.id}>
                    <td>
                      <strong>{paper.title}</strong>
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>{getPaperStatusBadge(paper.status)}</td>
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
                          disabled={paper.status === "WITHDRAWN"}
                          title={
                            paper.status === "WITHDRAWN"
                              ? "Không thể phân công cho bài đã rút"
                              : paperAssignments.length > 0
                              ? "Thêm reviewer cho bài này"
                              : "Phân công reviewer"
                          }
                        >
                          {paperAssignments.length > 0 ? "Thêm reviewer" : "Phân công"}
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
