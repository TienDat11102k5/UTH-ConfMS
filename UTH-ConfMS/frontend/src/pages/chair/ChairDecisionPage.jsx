// src/pages/chair/ChairDecisionPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairDecisionPage = () => {
  const { conferenceId } = useParams();
  const [papers, setPapers] = useState([]);
  const [reviews, setReviews] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load papers
        // Sửa: Gọi API lấy paper theo conference để tránh lỗi 403 Access Denied
        const papersRes = await apiClient.get(
          `/decisions/papers/${conferenceId}`
        );
        const allPapers = papersRes.data || [];
        const confPapers = allPapers.filter((p) => p.status === "UNDER_REVIEW");
        setPapers(confPapers);

        // Load reviews và statistics cho mỗi paper
        const reviewsMap = {};
        const statsMap = {};
        for (const paper of confPapers) {
          try {
            const statsRes = await apiClient.get(
              `/decisions/statistics/${paper.id}`
            );
            statsMap[paper.id] = statsRes.data;

            const reviewsRes = await apiClient.get(
              `/reviews/paper/${paper.id}`
            );
            reviewsMap[paper.id] = reviewsRes.data || [];
          } catch (err) {
            reviewsMap[paper.id] = [];
            statsMap[paper.id] = { totalReviews: 0, averageScore: 0 };
          }
        }
        setReviews(reviewsMap);
        setStatistics(statsMap);
      } catch (err) {
        console.error("Load error:", err);
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    if (conferenceId) loadData();
  }, [conferenceId]);

  const handleMakeDecision = async () => {
    if (!selectedPaper || !decision) {
      alert("Vui lòng chọn bài báo và quyết định!");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/decisions", {
        paperId: selectedPaper.id,
        status: decision,
        comment: comment,
      });

      alert("Ra quyết định thành công!");
      setSelectedPaper(null);
      setDecision("");
      setComment("");

      // Reload papers
      const papersRes = await apiClient.get(
        `/decisions/papers/${conferenceId}`
      );
      const allPapers = papersRes.data || [];
      const confPapers = allPapers.filter((p) => p.status === "UNDER_REVIEW");
      setPapers(confPapers);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDecision = async (paperIds, decisionStatus) => {
    if (
      !confirm(
        `Bạn có chắc muốn ra quyết định ${decisionStatus} cho ${paperIds.length} bài báo?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/decisions/bulk", {
        paperIds: paperIds,
        status: decisionStatus,
        comment: "",
      });

      alert(
        `Thành công: ${res.data.success}/${res.data.total} bài. Lỗi: ${res.data.failed}`
      );
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Ra quyết định">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Ra quyết định"
      subtitle="Tổng hợp reviews và ra quyết định Accept/Reject"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Ra quyết định</h2>
          <p className="data-page-subtitle">
            Xem tổng hợp điểm và nhận xét, sau đó ra quyết định Accept hoặc
            Reject cho từng bài báo.
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
            Không có bài nào đang chờ quyết định.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Track</th>
                <th>Tác giả</th>
                <th>Số reviews</th>
                <th>Điểm TB</th>
                <th>Reviews</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => {
                const paperReviews = reviews[paper.id] || [];
                const stats = statistics[paper.id] || {
                  totalReviews: 0,
                  averageScore: 0,
                };
                return (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <strong>{paper.title}</strong>
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>{stats.totalReviews}</td>
                    <td>
                      <strong
                        style={{
                          color:
                            stats.averageScore >= 1
                              ? "#2e7d32"
                              : stats.averageScore <= -1
                              ? "#d32f2f"
                              : "#666",
                        }}
                      >
                        {stats.averageScore.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      {paperReviews.length > 0 ? (
                        <div>
                          {paperReviews.map((review, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: "0.9em",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Score: {review.score}, Confidence:{" "}
                              {review.confidenceLevel}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#999" }}>Chưa có review</span>
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="btn-primary table-action"
                          onClick={() => {
                            setSelectedPaper(paper);
                            setDecision("");
                            setComment("");
                          }}
                        >
                          Ra quyết định
                        </button>
                        <button
                          className="btn-success table-action"
                          onClick={() =>
                            handleBulkDecision([paper.id], "ACCEPTED")
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="btn-danger table-action"
                          onClick={() =>
                            handleBulkDecision([paper.id], "REJECTED")
                          }
                        >
                          Reject
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

      {/* Modal ra quyết định */}
      {selectedPaper && (
        <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Ra quyết định cho: {selectedPaper.title}</h3>

            <div style={{ marginBottom: "1rem" }}>
              <strong>Thống kê:</strong>
              <ul>
                <li>
                  Số reviews: {statistics[selectedPaper.id]?.totalReviews || 0}
                </li>
                <li>
                  Điểm trung bình:{" "}
                  {statistics[selectedPaper.id]?.averageScore?.toFixed(2) ||
                    "0.00"}
                </li>
                <li>
                  Điểm min: {statistics[selectedPaper.id]?.minScore || "N/A"}
                </li>
                <li>
                  Điểm max: {statistics[selectedPaper.id]?.maxScore || "N/A"}
                </li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Quyết định *</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Chọn quyết định --</option>
                <option value="ACCEPTED">ACCEPTED - Chấp nhận</option>
                <option value="REJECTED">REJECTED - Từ chối</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú (tùy chọn)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="textarea-input"
                placeholder="Ghi chú nội bộ cho quyết định này..."
              />
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleMakeDecision}
                disabled={submitting || !decision}
              >
                {submitting ? "Đang xử lý..." : "Ra quyết định"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedPaper(null);
                  setDecision("");
                  setComment("");
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

export default ChairDecisionPage;
