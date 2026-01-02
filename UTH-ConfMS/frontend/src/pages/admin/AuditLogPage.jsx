import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import apiClient from "../../apiClient";

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Filters
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actorFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Convert UI page (1-based) to API page (0-based)
      const apiPage = currentPage - 1;
      let url = `/audit-logs?page=${apiPage}&size=${itemsPerPage}`;
      
      // Use search endpoint if filters are applied
      if (actorFilter || actionFilter) {
        url = `/audit-logs/search?page=${apiPage}&size=${itemsPerPage}`;
        if (actorFilter) url += `&actor=${encodeURIComponent(actorFilter)}`;
        if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      }
      
      const res = await apiClient.get(url);
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalItems(res.data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError("Không thể tải nhật ký audit. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchLogs();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const translateAction = (action) => {
    const translations = {
      'LOGIN_SUCCESS': 'Đăng nhập thành công',
      'LOGIN_FAILURE': 'Đăng nhập thất bại',
      'REGISTRATION': 'Đăng ký tài khoản',
      'PASSWORD_CHANGE': 'Đổi mật khẩu',
      'PASSWORD_RESET_REQUEST': 'Yêu cầu đặt lại mật khẩu',
      'PASSWORD_RESET_COMPLETE': 'Hoàn tất đặt lại mật khẩu',
      'ROLE_CHANGE': 'Thay đổi vai trò',
      'AUTHORIZATION_FAILURE': 'Lỗi phân quyền',
      'CONFERENCE_CREATE': 'Tạo hội nghị',
      'CONFERENCE_DELETE': 'Xóa hội nghị',
      'PAPER_SUBMIT': 'Nộp bài báo',
      'REVIEW_SUBMIT': 'Nộp đánh giá',
      'DECISION': 'Ra quyết định'
    };
    return translations[action] || action;
  };

  return (
    <AdminLayout title="Audit Logs"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: "1 1 300px", marginBottom: 0 }}>
            <label className="form-label">Tìm theo Actor (Email)</label>
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Nhập email..."
            />
          </div>
          <div className="form-group" style={{ flex: "1 1 300px", marginBottom: 0 }}>
            <label className="form-label">Loại hành động</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
              <option value="LOGIN_FAILURE">Đăng nhập thất bại</option>
              <option value="REGISTRATION">Đăng ký tài khoản</option>
              <option value="PASSWORD_CHANGE">Đổi mật khẩu</option>
              <option value="ROLE_CHANGE">Thay đổi vai trò</option>
              <option value="CONFERENCE_CREATE">Tạo hội nghị</option>
              <option value="CONFERENCE_DELETE">Xóa hội nghị</option>
              <option value="PAPER_SUBMIT">Nộp bài báo</option>
              <option value="REVIEW_SUBMIT">Nộp đánh giá</option>
              <option value="DECISION">Ra quyết định</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "stretch" }}>
            <button 
              className="btn-primary" 
              onClick={handleFilterChange}
              style={{ minWidth: "120px" }}
            >
              Lọc
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setActorFilter("");
                setActionFilter("");
                setCurrentPage(1);
              }}
              style={{ minWidth: "120px" }}
            >
              Xóa bộ lọc
            </button>
          </div>
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

      {loading ? (
        <div className="form-card">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>IP Address</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                      Không có dữ liệu audit log
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.actor}</td>
                      <td>
                        <span style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          background: log.action.includes("FAILURE") || log.action.includes("DELETE") 
                            ? "#fef2f2" 
                            : "#f0fdf4",
                          color: log.action.includes("FAILURE") || log.action.includes("DELETE")
                            ? "#991b1b"
                            : "#166534"
                        }}>
                          {translateAction(log.action)}
                        </span>
                      </td>
                      <td>{log.target || "-"}</td>
                      <td>{log.ipAddress || "-"}</td>
                      <td>{formatTimestamp(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemName="nhật ký"
            />
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AuditLogPage;




