// src/pages/reviewer/ReviewerCOI.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ReviewerCOI = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [papers, setPapers] = useState([]);
  const [myPapers, setMyPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("coi"); // 'coi' or 'bidding'
  const [formData, setFormData] = useState({
    paperId: "",
    reason: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      const reviewerId = currentUser.id;

      // Load all papers
      const papersRes = await apiClient.get("/papers");
      setPapers(papersRes.data || []);

      // Load conflicts của reviewer
      const conflictsRes = await apiClient.get(
        `/conflicts/reviewer/${reviewerId}`
      );
      setConflicts(conflictsRes.data || []);

      // Load papers được phân công (cho bidding)
      const assignmentsRes = await apiClient.get(
        `/assignments/my-assignments?reviewerId=${reviewerId}`
      );
      const assignedPapers = assignmentsRes.data.map((a) => a.paper);
      setMyPapers(assignedPapers);
    } catch (err) {
      console.error("Load error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCOI = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      setError("Vui lòng nhập lý do xung đột");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      const reviewerId = currentUser.id;

      await apiClient.post(
        `/conflicts?reviewerId=${reviewerId}&paperId=${
          formData.paperId
        }&reason=${encodeURIComponent(formData.reason.trim())}`
      );

      setSuccess("Khai báo COI thành công!");
      setShowForm(false);
      setFormData({ paperId: "", reason: "" });
      await loadData(); // Reload data
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Lỗi khi khai báo COI"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCOI = async (coiId) => {
    if (!confirm("Bạn có chắc muốn xóa khai báo COI này?")) return;

    try {
      await apiClient.delete(`/conflicts/${coiId}`);
      setSuccess("Đã xóa COI thành công");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Lỗi khi xóa COI"
      );
    }
  };

  // Filter out papers already in COI list
  const availablePapers = papers.filter(
    (paper) => !conflicts.some((c) => c.paper?.id === paper.id)
  );

  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Quản lý COI & Bidding">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Quản lý COI & Bidding"
      subtitle="Khai báo xung đột lợi ích và xem danh sách bài được phân công"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Reviewer</span>
          </div>
          <h2 className="data-page-title">Quản lý COI & Bidding</h2>
          <p className="data-page-subtitle">
            Khai báo xung đột lợi ích để tránh được phân công chấm các bài không phù hợp.
          </p>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        gap: "1rem", 
        marginBottom: "2rem",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <button
          onClick={() => setActiveTab("coi")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "coi" ? "#0066cc" : "transparent",
            color: activeTab === "coi" ? "white" : "#666",
            border: "none",
            borderBottom: activeTab === "coi" ? "3px solid #0066cc" : "none",
            cursor: "pointer",
            fontWeight: activeTab === "coi" ? "600" : "400",
            fontSize: "1rem",
          }}
        >
          Quản lý COI
        </button>
        <button
          onClick={() => setActiveTab("bidding")}
          style={{
            padding: "0.75rem 1.5rem",
            background: activeTab === "bidding" ? "#0066cc" : "transparent",
            color: activeTab === "bidding" ? "white" : "#666",
            border: "none",
            borderBottom: activeTab === "bidding" ? "3px solid #0066cc" : "none",
            cursor: "pointer",
            fontWeight: activeTab === "bidding" ? "600" : "400",
            fontSize: "1rem",
          }}
        >
          Bidding / Gợi ý bài
        </button>
      </div>

      {success && (
        <div
          style={{
            background: "#e8f5e9",
            border: "1px solid #4caf50",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#2e7d32",
          }}
        >
          ✓ {success}
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

      {/* COI Tab */}
      {activeTab === "coi" && (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "✕ Đóng form" : "+ Khai báo COI mới"}
            </button>
          </div>

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
                    {availablePapers.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.title} (Track: {paper.track?.name || "N/A"})
                      </option>
                    ))}
                  </select>
                  <div className="field-hint">
                    Chỉ hiển thị các bài chưa khai báo COI
                  </div>
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
                    placeholder="Ví dụ: Cùng cơ quan, đồng nghiệp, cố vấn luận án, quan hệ họ hàng..."
                    maxLength={500}
                  />
                  <div style={{ 
                    textAlign: "right", 
                    fontSize: "0.85rem", 
                    color: "#666", 
                    marginTop: "0.25rem" 
                  }}>
                    {formData.reason.length}/500 ký tự
                  </div>
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
            <h3 style={{ marginBottom: "1rem" }}>Danh sách COI đã khai báo</h3>
            {conflicts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
                Bạn chưa khai báo COI nào.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiêu đề bài báo</th>
                    <th>Track</th>
                    <th>Lý do</th>
                    <th>Ngày khai báo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((conflict) => (
                    <tr key={conflict.id}>
                      <td>{conflict.paper?.id}</td>
                      <td>
                        <strong>{conflict.paper?.title}</strong>
                      </td>
                      <td>{conflict.paper?.track?.name || "N/A"}</td>
                      <td style={{ maxWidth: "300px" }}>{conflict.reason}</td>
                      <td>
                        {new Date(conflict.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <button
                          className="btn-secondary table-action"
                          style={{ color: "#d32f2f" }}
                          onClick={() => handleDeleteCOI(conflict.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Bidding Tab */}
      {activeTab === "bidding" && (
        <div className="form-card">
          <h3>Gợi ý bài phù hợp (Bidding)</h3>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            Dưới đây là danh sách các bài báo hiện được phân công cho bạn. 
            Tính năng gợi ý bài dựa trên keyword/topic embeddings sẽ được bổ sung trong phiên bản tiếp theo.
          </p>

          {myPapers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
              Bạn chưa được phân công bài nào.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề</th>
                  <th>Track</th>
                  <th>Keywords</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {myPapers.map((paper) => (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <strong>{paper.title}</strong>
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td style={{ maxWidth: "200px", fontSize: "0.9rem" }}>
                      {paper.keywords || "N/A"}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {paper.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary table-action"
                        onClick={() => navigate(`/reviewer/assignments`)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "8px",
            }}
          >
            <strong>💡 Lưu ý:</strong> Tính năng bidding tự động dựa trên 
            keyword/topic embeddings (AI) sẽ được tích hợp sau. Hiện tại việc phân 
            công bài được thực hiện thủ công bởi Chair.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReviewerCOI;
