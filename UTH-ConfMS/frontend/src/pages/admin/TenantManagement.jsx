import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import apiClient from "../../apiClient";

const TenantManagement = () => {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      u.email?.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Quản lý người dùng"
      subtitle="Tìm kiếm, xem nhanh vai trò và trạng thái người dùng trong hệ thống (dữ liệu demo)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Người dùng</span>
          </div>
          <h2 className="data-page-title">Danh sách tài khoản</h2>
          <p className="data-page-subtitle">
            Khi kết nối backend, bảng này sẽ hiển thị danh sách người dùng thật
            kèm phân quyền.
          </p>
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
              <th style={{ width: "180px" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Không tìm thấy tài khoản phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
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
                    <div className="inline-actions">
                      <button
                        className="btn-secondary table-action"
                        type="button"
                        onClick={async () => {
                          const newRole = window.prompt(
                            `Gán vai trò cho ${u.email} (ví dụ: AUTHOR, REVIEWER, CHAIR, ADMIN)`,
                            u.role
                          );
                          if (!newRole) return;
                          try {
                            await apiClient.put(`/admin/users/${u.id}/role`, {
                              role: newRole,
                            });
                            fetchUsers();
                          } catch (err) {
                            console.error(err);
                            alert("Cập nhật vai trò thất bại");
                          }
                        }}
                      >
                        Phân quyền
                      </button>

                      <button
                        className="btn-primary table-action"
                        type="button"
                        onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                      >
                        Sửa
                      </button>

                      <button
                        className="btn-danger table-action"
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Xác nhận xoá tài khoản này?"))
                            return;
                          try {
                            await apiClient.delete(`/admin/users/${u.id}`);
                            setUsers((s) => s.filter((x) => x.id !== u.id));
                          } catch (err) {
                            console.error(err);
                            alert("Xoá thất bại");
                          }
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default TenantManagement;


