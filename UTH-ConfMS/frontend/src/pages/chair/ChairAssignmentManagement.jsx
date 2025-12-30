// src/pages/chair/ChairAssignmentManagement.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import "../../styles/ChairAssignmentManagement.css";

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

  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        if (res.data?.length > 0) {
          setSelectedConference(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadConferences();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedConference) return;
      try {
        setLoading(true);
        setError("");

        const papersRes = await apiClient.get(
          `/decisions/papers/${selectedConference}`
        );
        const confPapers = papersRes.data || [];
        setPapers(confPapers);

        const usersRes = await apiClient.get("/decisions/reviewers");
        setReviewers(usersRes.data || []);

        const assignmentsMap = {};
        for (const paper of confPapers) {
          try {
            const res = await apiClient.get(
              `/assignments/paper/${paper.id}`
            );
            assignmentsMap[paper.id] = res.data || [];
          } catch {
            assignmentsMap[paper.id] = [];
          }
        }
        setAssignments(assignmentsMap);
      } catch (err) {
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedConference]);

  const handleAssign = async () => {
    if (!selectedPaper || !selectedReviewer) return;

    setSubmitting(true);
    try {
      await apiClient.post("/assignments", {
        paperId: selectedPaper.id,
        reviewerId: parseInt(selectedReviewer),
      });
      alert("Phân công thành công!");
      setShowAssignModal(false);
      setSelectedReviewer("");

      const res = await apiClient.get(
        `/assignments/paper/${selectedPaper.id}`
      );
      setAssignments({
        ...assignments,
        [selectedPaper.id]: res.data || [],
      });
    } catch (err) {
      alert(err.response?.data || "Phân công thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Quản lý Assignment">
        <div className="loading-box">Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Quản lý Assignment"
      subtitle="Phân công Reviewer/PC cho các bài báo"
    >
      {/* Chọn hội nghị */}
      {conferences.length > 0 && (
        <div className="conference-box">
          <label>Chọn hội nghị:</label>
          <select
            value={selectedConference || ""}
            onChange={(e) =>
              setSelectedConference(parseInt(e.target.value))
            }
          >
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
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
            {papers.map((paper) => (
              <tr key={paper.id}>
                <td><strong>{paper.title}</strong></td>
                <td>{paper.track?.name || "N/A"}</td>
                <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                <td>{paper.status}</td>
                <td>
                  {(assignments[paper.id] || []).length === 0
                    ? <span className="text-muted">Chưa phân công</span>
                    : assignments[paper.id].map((a) => (
                        <div key={a.id} className="reviewer-line">
                          {a.reviewer?.fullName}
                        </div>
                      ))}
                </td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSelectedPaper(paper);
                      setShowAssignModal(true);
                    }}
                  >
                    Phân công
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAssignModal && selectedPaper && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Phân công Reviewer</h3>
            <select
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="form-input"
            >
              <option value="">-- Chọn reviewer --</option>
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={submitting}
              >
                Phân công
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
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
