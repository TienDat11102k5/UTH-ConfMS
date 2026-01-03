import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from "../../apiClient";
import { ToastContainer } from "../../components/Toast";

const TenantManagement = () => {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on keyword
  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      u.email?.toLowerCase().includes(keyword.toLowerCase())
  );

  // Pagination using hook
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedUsers } =
    usePagination(filtered, 20);

  return (
    <AdminLayout
      title="QUẢN LÝ NGƯỜI DÙNG"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
          </div>
        </div>
        <div className="data-page-header-right">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              padding: "0.65rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              minWidth: "220px",
            }}
          />
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate("/admin/users/create")}
          >
            + Tạo tài khoản
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th style={{ width: "120px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Đang tải...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Không tìm thấy tài khoản phù hợp.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className="badge-soft">
                      {u.status === "Active" ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dbeafe';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Sửa"
                      >
                        <FiEdit2 size={18} color="#2563eb" />
                      </button>

                      <button
                        onClick={async () => {
                          if (!window.confirm("Xác nhận xoá tài khoản này?"))
                            return;
                          try {
                            await apiClient.delete(`/admin/users/${u.id}`);
                            setUsers((s) => s.filter((x) => x.id !== u.id));
                          } catch (err) {
                            console.error(err);
                            addToast("Xoá thất bại", "error");
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Xóa"
                      >
                        <FiTrash2 size={18} color="#dc2626" />
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
      {!loading && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="người dùng"
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default TenantManagement;
