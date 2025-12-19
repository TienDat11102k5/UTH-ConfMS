// src/pages/reviewer/ReviewerCOI.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ReviewerCOI = () => {
  const [conflicts, setConflicts] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    paperId: "",
    reason: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}"
        );
        const reviewerId = currentUser.id;

        // Load papers để chọn khai báo COI
        const papersRes = await apiClient.get("/papers");
        setPapers(papersRes.data || []);

        // Load conflicts của reviewer này
        const conflictsRes = await apiClient.get(
          `/conflicts/reviewer/${reviewerId}`
        );
        setConflicts(conflictsRes.data || []);
      } catch (err) {
        console.error("Load error:", err);
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmitCOI = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      const reviewerId = currentUser.id;

      await apiClient.post(
        `/conflicts?reviewerId=${reviewerId}&paperId=${
          formData.paperId
        }&reason=${encodeURIComponent(formData.reason)}`
      );

      alert("Khai báo COI thành công!");
      setShowForm(false);
      setFormData({ paperId: "", reason: "" });
      // Reload conflicts
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Lỗi khi khai báo COI"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Quản lý COI">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Quản lý COI &amp; Bidding"
      subtitle="Khai báo xung đột lợi ích (COI) với các bài báo"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Reviewer</span>
          </div>
          <h2 className="data-page-title">Quản lý COI</h2>
          <p className="data-page-subtitle">
            Khai báo xung đột lợi ích để tránh được phân công chấm các bài không
            phù hợp.
          </p>
        </div>
        <div className="data-page-header-right">
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Khai báo COI mới
          </button>
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

      {showForm && (
        <div className="form-card" style={{ marginBottom: "2rem" }}>
          <h3>Khai báo COI mới</h3>
          <form onSubmit={handleSubmitCOI} className="submission-form">
            <div className="form-group">
              <label className="form-label">Chọn bài báo *</label>
              <select
                value={formData.paperId}
                onChange={(e) =>
                  setFormData({ ...formData, paperId: e.target.value })
                }
                required
                className="form-input"
              >
                <option value="">-- Chọn bài báo --</option>
                {papers.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} (Track: {paper.track?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lý do xung đột *</label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
                rows={4}
                className="textarea-input"
                placeholder="Ví dụ: Cùng cơ quan, đồng nghiệp, cố vấn luận án..."
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Đang gửi..." : "Khai báo COI"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ paperId: "", reason: "" });
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        {conflicts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            Bạn chưa khai báo COI nào.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Bài</th>
                <th>Tiêu đề</th>
                <th>Lý do</th>
                <th>Ngày khai báo</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((conflict) => (
                <tr key={conflict.id}>
                  <td>{conflict.paper?.id}</td>
                  <td>{conflict.paper?.title}</td>
                  <td>{conflict.reason}</td>
                  <td>
                    {new Date(conflict.createdAt).toLocaleDateString("vi-VN")}
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

export default ReviewerCOI;
