import { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from "../../apiClient";
import { FiDownload, FiRotateCcw, FiTrash2 } from 'react-icons/fi';

const BackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(backups, 20);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/backups");
      setBackups(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách backup.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm("Bạn có chắc muốn tạo backup mới?")) return;
    
    try {
      setCreating(true);
      await apiClient.post("/backups");
      alert("Tạo backup thành công!");
      fetchBackups();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Tạo backup thất bại.";
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await apiClient.get(`/backups/download/${filename}`, {
        responseType: 'blob'
      });
      
      // Tạo URL từ blob và trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Tải xuống thất bại.");
    }
  };

  const handleRestore = async (filename) => {
    if (!confirm(`CẢNH BÁO: Khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại!\n\nBạn có chắc muốn khôi phục từ: ${filename}?`)) {
      return;
    }
    
    try {
      await apiClient.post(`/backups/restore/${filename}`);
      alert("Khôi phục thành công! Vui lòng đăng nhập lại.");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Khôi phục thất bại.";
      alert(errorMsg);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Bạn có chắc muốn xóa backup: ${filename}?`)) return;
    
    try {
      await apiClient.delete(`/backups/${filename}`);
      alert("Xóa backup thành công!");
      fetchBackups();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Xóa backup thất bại.";
      alert(errorMsg);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <AdminLayout title="Backup & Restore"
      subtitle="Tạo bản sao lưu định kỳ và khôi phục khi cần."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Backup</span>
          </div>
          <h2 className="data-page-title">Sao lưu &amp; khôi phục</h2>
          <p className="data-page-subtitle">
            Quản lý backup database (JSON format)
          </p>
        </div>
        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            type="button"
            onClick={fetchBackups}
            disabled={loading}
          >
            Làm mới
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? "Đang tạo..." : "+ Tạo backup"}
          </button>
        </div>
      </div>

      {error && (
        <div className="form-card" style={{ 
          background: "#fef2f2", 
          border: "1px solid #fecaca", 
          color: "#991b1b",
          marginBottom: "1rem"
        }}>
          {error}
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Tạo backup</h3>
          <p>Thực hiện backup database ngay lập tức.</p>
          <button
            className="btn-primary"
            type="button"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? "Đang tạo..." : "Backup ngay"}
          </button>
        </div>
        <div className="dash-card">
          <h3>Lưu ý</h3>
          <p style={{ color: "#991b1b", fontWeight: 500 }}>
            ⚠️ Khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại. Hãy cẩn thận!
          </p>
          <p style={{ fontSize: "0.9em", color: "#6b7280", marginTop: "0.5rem" }}>
            Backup được lưu dưới dạng JSON nén (GZIP). Không cần cài đặt thêm công cụ.
          </p>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: "2rem" }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Tên file</th>
              <th style={{ width: "120px" }}>Kích thước</th>
              <th style={{ width: "180px" }}>Thời gian tạo</th>
              <th style={{ width: "140px", textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  Chưa có backup nào. Nhấn "Tạo backup" để tạo mới.
                </td>
              </tr>
            ) : (
              paginatedItems.map((b, index) => (
                <tr key={index}>
                  <td>{b.name}</td>
                  <td>{formatSize(b.size)}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                      <button 
                        type="button"
                        title="Tải xuống"
                        onClick={() => handleDownload(b.name)}
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
                        <FiDownload size={17} />
                      </button>
                      
                      <button 
                        type="button"
                        title="Khôi phục"
                        onClick={() => handleRestore(b.name)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#3b82f6",
                          transition: "all 0.2s"
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
                        <FiRotateCcw size={17} />
                      </button>
                      
                      <button 
                        type="button"
                        title="Xóa"
                        onClick={() => handleDelete(b.name)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#ef4444",
                          transition: "all 0.2s"
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

      {!loading && backups.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={backups.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="bản sao lưu"
        />
      )}
    </AdminLayout>
  );
};

export default BackupPage;



