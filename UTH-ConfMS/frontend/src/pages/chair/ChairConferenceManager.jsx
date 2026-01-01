import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { FiFileText, FiEdit, FiEye, FiEyeOff, FiTrash2, FiLock } from 'react-icons/fi';

const ChairConferenceManager = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems} =
    usePagination(conferences, 20);

  // --- 1. Lấy dữ liệu ---
  const fetchConfs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách hội nghị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfs();
  }, []);

  const handleDelete = async (id) => {
    if (
      !confirm(
        "CẢNH BÁO: Chỉ xóa được hội nghị chưa có bài nộp, nếu có hãy ẩn hội nghị?"
      )
    )
      return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data || "Xoá thất bại. Có thể do ràng buộc dữ liệu.";
      alert(errorMsg);
    }
  };

  const handleToggleHidden = async (id, currentStatus) => {
    const action = currentStatus ? "hiện" : "ẩn";
    if (!confirm(`Bạn có chắc muốn ${action} hội nghị này?`)) return;
    
    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-hidden`);
      setConferences((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
      alert(`Đã ${action} hội nghị thành công!`);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data || `Không thể ${action} hội nghị. Vui lòng thử lại.`;
      alert(errorMsg);
    }
  };

  return (
    <DashboardLayout
      roleLabel="Chủ tịch Chương trình / Chủ tịch Chuyên đề"
      title="Quản lý Hội nghị"
      subtitle="Tạo và quản lý các hội nghị khoa học."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Hội nghị</span>
          </div>
          <h2 className="data-page-title">Danh sách hội nghị</h2>
          
        </div>

        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchConfs}>
            Làm mới
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate("/chair/conferences/create")}
          >
            + Tạo hội nghị
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Tên Hội nghị</th>
              <th>Thời gian diễn ra</th>
              <th>Hạn nộp bài</th>
              <th>Hạn nộp bản cuối</th>
              <th style={{ width: "100px" }}>Trạng thái</th>
              <th style={{ width: "220px", textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="table-empty" style={{ color: "#d72d2d" }}>
                  {error}
                </td>
              </tr>
            ) : conferences.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Chưa có hội nghị nào. Nhấn "Tạo hội nghị" để thêm mới.
                </td>
              </tr>
            ) : (
              paginatedItems.map((c) => (
                <tr key={c.id} style={{ opacity: c.isHidden ? 0.6 : 1 }}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {c.tracks && c.tracks.length > 0
                        ? `${c.tracks.length} track${c.tracks.length > 1 ? "s" : ""}`
                        : "Chưa có track"}
                    </div>
                  </td>
                  <td>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "..."} -{" "}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>Chưa đặt</span>
                    )}
                  </td>
                  <td>
                    {c.cameraReadyDeadline ? (
                      <span className="badge-soft" style={{ background: "#fef3c7", color: "#92400e" }}>
                        {new Date(c.cameraReadyDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>Chưa đặt</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                      {c.isHidden ? (
                        <span className="badge-danger">Đã ẩn</span>
                      ) : (
                        <span className="badge-success">Hiển thị</span>
                      )}
                      {c.isLocked && (
                        <FiLock size={16} color="#ef4444" title="Hội nghị đã bị khóa" />
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                      <button
                        type="button"
                        title="Xem bài nộp"
                        onClick={() => navigate(`/chair/conferences/${c.id}/submissions`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#14b8a6",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0fdfa";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiFileText size={17} />
                      </button>
                      
                      <button
                        type="button"
                        title={c.isLocked ? "Hội nghị đã bị khóa bởi Admin" : "Sửa"}
                        onClick={() => navigate(`/chair/conferences/${c.id}/edit`)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#3b82f6",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiEdit size={17} />
                      </button>
                      
                      <button
                        type="button"
                        title={c.isLocked ? "Hội nghị đã bị khóa bởi Admin" : (c.isHidden ? "Hiện" : "Ẩn")}
                        onClick={() => handleToggleHidden(c.id, c.isHidden)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: c.isHidden ? "#059669" : "#f59e0b",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = c.isHidden ? "#ecfdf5" : "#fffbeb";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {c.isHidden ? <FiEye size={17} /> : <FiEyeOff size={17} />}
                      </button>
                      
                      <button
                        type="button"
                        title={c.isLocked ? "Hội nghị đã bị khóa bởi Admin" : "Xóa"}
                        onClick={() => handleDelete(c.id)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#ef4444",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && conferences.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={conferences.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="hội nghị"
        />
      )}
    </DashboardLayout>
  );
};

export default ChairConferenceManager;
