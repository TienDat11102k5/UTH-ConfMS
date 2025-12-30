import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import "../../styles/ChairDecisionPage.css";

const ChairDecisionPage = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [papers, setPapers] = useState([]);
  const [reviews, setReviews] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    apiClient.get("/conferences").then((res) => {
      setConferences(res.data || []);
      if (res.data?.length) setSelectedConference(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedConference) return;

    const load = async () => {
      setLoading(true);
      const papersRes = await apiClient.get(
        `/decisions/papers/${selectedConference}`
      );

      const underReview = (papersRes.data || []).filter(
        (p) => p.status === "UNDER_REVIEW"
      );
      setPapers(underReview);

      const rMap = {};
      const sMap = {};

      for (const p of underReview) {
        try {
          const stats = await apiClient.get(
            `/decisions/statistics/${p.id}`
          );
          const revs = await apiClient.get(`/reviews/paper/${p.id}`);
          sMap[p.id] = stats.data;
          rMap[p.id] = revs.data || [];
        } catch {
          sMap[p.id] = { totalReviews: 0, averageScore: 0 };
          rMap[p.id] = [];
        }
      }

      setStatistics(sMap);
      setReviews(rMap);
      setLoading(false);
    };

    load();
  }, [selectedConference]);

  const submitDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    await apiClient.post("/decisions", {
      paperId: selectedPaper.id,
      status: decision,
      comment,
    });
    setSubmitting(false);
    setSelectedPaper(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout title="Ra quyết định">
        <div className="loading">Đang tải dữ liệu...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Ra quyết định"
      subtitle="Tổng hợp đánh giá & quyết định bài báo"
      roleLabel="Program / Track Chair"
    >
      <div className="decision-page decision-layout">
        {/* Filter */}
        <div className="card filter-card">
          <label>Hội nghị</label>
          <select
            value={selectedConference || ""}
            onChange={(e) => setSelectedConference(+e.target.value)}
          >
            {conferences.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card table-card">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>Reviews</th>
                <th>Điểm TB</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => {
                const stats = statistics[p.id] || {};
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="paper-title">{p.title}</div>
                      <div className="track">{p.track?.name}</div>
                    </td>
                    <td>{p.mainAuthor?.fullName}</td>
                    <td>{stats.totalReviews || 0}</td>
                    <td>
                      <span
                        className={`score ${
                          stats.averageScore >= 1
                            ? "good"
                            : stats.averageScore <= -1
                            ? "bad"
                            : "neutral"
                        }`}
                      >
                        {stats.averageScore?.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setSelectedPaper(p);
                          setDecision("");
                          setComment("");
                        }}
                      >
                        Ra quyết định
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {papers.length === 0 && (
            <div className="empty">Không có bài cần quyết định</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedPaper && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{selectedPaper.title}</h3>

            <div className="stats">
              <div>
                Reviews:{" "}
                <strong>
                  {statistics[selectedPaper.id]?.totalReviews || 0}
                </strong>
              </div>
              <div>
                Điểm TB:{" "}
                <strong>
                  {statistics[selectedPaper.id]?.averageScore?.toFixed(2)}
                </strong>
              </div>
            </div>

            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="">-- Quyết định --</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <textarea
              placeholder="Ghi chú nội bộ..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="btn-primary"
                disabled={submitting || !decision}
                onClick={submitDecision}
              >
                Xác nhận
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedPaper(null)}
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
