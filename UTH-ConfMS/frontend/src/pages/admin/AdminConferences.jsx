import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import {
  FiEdit,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

const AdminConferences = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
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
        "CẢNH BÁO: Chỉ xóa được hội nghị chưa có bài nộp, nếu có vui lòng ẩn hội nghị"
      )
    )
      return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại. Có thể do ràng buộc dữ liệu.");
    }
  };

  const handleToggleHidden = async (id, currentStatus) => {
    const action = currentStatus ? "hiện" : "ẩn";
    if (!confirm(`Bạn có chắc muốn ${action} hội nghị này?`)) return;

    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-hidden`);
      setConferences((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      alert(`Đã ${action} hội nghị thành công!`);
    } catch (err) {
      console.error(err);
      alert(`Không thể ${action} hội nghị. Vui lòng thử lại.`);
    }
  };

  const handleToggleLocked = async (id, currentStatus) => {
    const action = currentStatus ? "mở khóa" : "khóa";
    if (
      !confirm(
        `Bạn có chắc muốn ${action} hội nghị này?\n${
          currentStatus
            ? ""
            : "Khi khóa, Chair sẽ không thể chỉnh sửa hoặc xóa hội nghị."
        }`
      )
    )
      return;

    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-locked`);
      setConferences((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      alert(`Đã ${action} hội nghị thành công!`);
    } catch (err) {
      console.error(err);
      alert(`Không thể ${action} hội nghị. Vui lòng thử lại.`);
    }
  };

  return (
    <AdminLayout
      title="QUẢN LÝ HỘI NGHỊ"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
          </div>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchConfs}>
            Làm mới
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate("/admin/conferences/create")}
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
              <th style={{ width: "130px" }}>Trạng thái</th>
              <th style={{ width: "200px", textAlign: "center" }}>Thao tác</th>
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
                <td
                  colSpan={7}
                  className="table-empty"
                  style={{ color: "#d72d2d" }}
                >
                  {error}
                </td>
              </tr>
            ) : conferences.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Chưa có hội nghị nào. Nhấn{" "}
                  <button
                    type="button"
                    className="link-inline"
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    “Tạo hội nghị”
                  </button>{" "}
                  để thêm mới.
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
                        ? `${c.tracks.length} Chủ đề ${
                            c.tracks.length > 1 ? "" : ""
                          }`
                        : "Chưa có track"}
                    </div>
                  </td>
                  <td>
                    {c.startDate
                      ? new Date(c.startDate).toLocaleDateString()
                      : "..."}{" "}
                    -{" "}
                    {c.endDate
                      ? new Date(c.endDate).toLocaleDateString()
                      : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>
                        Chưa đặt
                      </span>
                    )}
                  </td>
                  <td>
                    {c.cameraReadyDeadline ? (
                      <span className="badge-soft" style={{ background: "#fef3c7", color: "#92400e" }}>
                        {new Date(c.cameraReadyDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>
                        Chưa đặt
                      </span>
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
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        title="Xem bài nộp"
                        onClick={() =>
                          navigate(`/admin/conferences/${c.id}/submissions`)
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#14b8a6",
                          transition: "all 0.2s",
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
                        title="Sửa"
                        onClick={() =>
                          navigate(`/admin/conferences/${c.id}/edit`)
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#3b82f6",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#eff6ff";
                          e.currentTarget.style.transform = "scale(1.1)";
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
                        title={c.isHidden ? "Hiện" : "Ẩn"}
                        onClick={() => handleToggleHidden(c.id, c.isHidden)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#f59e0b",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fffbeb";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {c.isHidden ? (
                          <FiEye size={17} />
                        ) : (
                          <FiEyeOff size={17} />
                        )}
                      </button>

                      <button
                        type="button"
                        title={c.isLocked ? "Mở khóa" : "Khóa"}
                        onClick={() => handleToggleLocked(c.id, c.isLocked)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#8b5cf6",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f5f3ff";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {c.isLocked ? (
                          <FiUnlock size={17} />
                        ) : (
                          <FiLock size={17} />
                        )}
                      </button>

                      <button
                        type="button"
                        title="Xóa"
                        onClick={() => handleDelete(c.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#ef4444",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fef2f2";
                          e.currentTarget.style.transform = "scale(1.1)";
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
    </AdminLayout>
  );
};

export default AdminConferences;
