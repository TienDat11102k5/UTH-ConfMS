// src/pages/reviewer/ReviewerCOI.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { ToastContainer } from "../../components/Toast";
import { FiAlertTriangle, FiPlus, FiX, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const ReviewerCOI = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    paperId: "",
    reason: "",
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError("");
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
    } catch (err) {
      console.error("Load error:", err);
      setLoadError(
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
      addToast("Vui lòng nhập lý do xung đột", "warning");
      return;
    }

    setSubmitting(true);

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

      addToast("Khai báo xung đột lợi ích thành công!", "success");
      setShowForm(false);
      setFormData({ paperId: "", reason: "" });
      await loadData(); // Reload data
    } catch (err) {
      addToast(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Lỗi khi khai báo xung đột lợi ích",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCOI = async (coiId) => {
    if (!confirm("Bạn có chắc muốn xóa khai báo xung đột lợi ích này?")) return;

    try {
      await apiClient.delete(`/conflicts/${coiId}`);
      addToast("Đã xóa xung đột lợi ích thành công", "success");
      await loadData();
    } catch (err) {
      addToast(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Lỗi khi xóa xung đột lợi ích",
        "error"
      );
    }
  };

  // Filter out papers already in COI list
  const availablePapers = papers.filter(
    (paper) => !conflicts.some((c) => c.paper?.id === paper.id)
  );

  if (loading) {
    return (
      <DashboardLayout roleLabel="Người chấm" title="Quản lý xung đột lợi ích">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Người chấm"
      title="Quản lý xung đột lợi ích"
      subtitle="Khai báo xung đột lợi ích và xem danh sách bài được phân công"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Người chấm</span>
          </div>
          <h2 className="data-page-title">
            <FiAlertTriangle style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "#f59e0b" }} />
            Quản lý xung đột lợi ích
          </h2>
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

      {loadError && (
        <div className="alert-error">
          <FiXCircle size={20} />
          <span>{loadError}</span>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <FiX size={18} style={{ marginRight: "0.5rem" }} />
              Đóng form
            </>
          ) : (
            <>
              <FiPlus size={18} style={{ marginRight: "0.5rem" }} />
              Khai báo xung đột lợi ích mới
            </>
          )}
        </button>
      </div>

      {showForm && (
              <div style={{
                marginBottom: "1.5rem",
                background: "white",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}>
                  <FiAlertTriangle size={16} />
                  Khai báo xung đột lợi ích mới
                </div>
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
                          {paper.title} (Chủ đề: {paper.track?.name || "N/A"})
                        </option>
                      ))}
                    </select>
                    <div className="field-hint">
                      Chỉ hiển thị các bài chưa khai báo xung đột lợi ích
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
                    <div className="char-count">
                      {formData.reason.length}/500 ký tự
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting}
                    >
                      <FiCheckCircle size={18} style={{ marginRight: "0.5rem" }} />
                      {submitting ? "Đang gửi..." : "Khai báo xung đột"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({ paperId: "", reason: "" });
                      }}
                    >
                      <FiX size={18} style={{ marginRight: "0.5rem" }} />
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              <FiAlertTriangle size={16} />
              Danh sách xung đột lợi ích đã khai báo ({conflicts.length})
            </div>
              {conflicts.length === 0 ? (
                <div className="empty-state">
                  <FiAlertTriangle size={48} style={{ color: "#cbd5e1" }} />
                  <p>Bạn chưa khai báo xung đột lợi ích nào.</p>
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                    Nhấn nút "Khai báo xung đột lợi ích mới" để thêm.
                  </p>
                </div>
              ) : (
                <div className="coi-table-wrapper">
                  <table className="coi-table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>ID</th>
                        <th>Tiêu đề bài báo</th>
                        <th style={{ width: "150px" }}>Chủ đề</th>
                        <th style={{ width: "250px" }}>Lý do</th>
                        <th style={{ width: "120px" }}>Ngày khai báo</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Thao tác</th>
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
                          <td className="reason-cell">{conflict.reason}</td>
                          <td>
                            {new Date(conflict.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-delete-icon"
                              onClick={() => handleDeleteCOI(conflict.id)}
                              title="Xóa xung đột lợi ích"
                            >
                              <FiTrash2 size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

      <style dangerouslySetInnerHTML={{__html: `
        .coi-tabs {
          display: none;
        }

        .coi-tab {
          display: none;
        }

        .coi-tab.active {
          display: none;
        }

        .alert-success {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          color: #065f46;
        }

        .alert-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          color: #991b1b;
        }

        .coi-card-header {
          display: none;
        }

        .coi-card-body {
          padding: 0;
        }

        .coi-card {
          background: transparent;
          box-shadow: none;
        }

        .coi-form-card {
          background: transparent;
          box-shadow: none;
        }

        .coi-form-header {
          display: none;
        }

        .coi-form-body {
          padding: 0;
        }

        .char-count {
          text-align: right;
          font-size: 0.85rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        .coi-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .coi-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .coi-card-body {
          padding: 1.5rem;
        }

        .bidding-description {
          display: none;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .empty-state p {
          margin-top: 1rem;
        }

        .coi-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .coi-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .coi-table thead {
          background: #f8fafc;
        }

        .coi-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e2e8f0;
        }

        .coi-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }

        .coi-table tbody tr {
          transition: background 0.2s;
        }

        .coi-table tbody tr:hover {
          background: #f8fafc;
        }

        .coi-table tbody tr:last-child td {
          border-bottom: none;
        }

        .reason-cell {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .keywords-cell {
          color: #64748b;
          font-size: 0.9rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-accepted {
          background: #d1fae5;
          color: #065f46;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-withdrawn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-pending, .status-submitted {
          background: #dbeafe;
          color: #1e40af;
        }

        .btn-delete-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          color: #ef4444;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-delete-icon:hover {
          background: #fee2e2;
          transform: scale(1.1);
        }

        .btn-view-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          color: #3b82f6;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-view-icon:hover {
          background: #dbeafe;
          transform: scale(1.1);
        }
      `}} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ReviewerCOI;
