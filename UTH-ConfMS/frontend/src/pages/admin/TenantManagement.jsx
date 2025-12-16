import React, { useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const mockUsers = [
  { id: 1, name: "Nguyễn Văn A", email: "a@uth.edu.vn", role: "Admin", status: "Active" },
  { id: 2, name: "Trần Thị B", email: "b@uth.edu.vn", role: "Chair", status: "Active" },
  { id: 3, name: "Lê C", email: "c@uth.edu.vn", role: "Reviewer", status: "Suspended" },
];

const TenantManagement = () => {
  const [users] = useState(mockUsers);
  const [keyword, setKeyword] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(keyword.toLowerCase()) ||
      u.email.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Quản lý người dùng"
      subtitle="Tìm kiếm, xem nhanh vai trò và trạng thái người dùng trong hệ thống."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Người dùng</span>
          </div>
          <h2 className="data-page-title">Danh sách tài khoản</h2>
          <p className="data-page-subtitle">
            Đây là dữ liệu giả lập để minh họa giao diện. Kết nối API sẽ hiển thị danh sách thật.
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
          <button className="btn-primary" type="button">
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
              <th style={{ width: "160px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
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
                      <button className="btn-secondary table-action" type="button">
                        Phân quyền
                      </button>
                      <button className="btn-primary table-action" type="button">
                        Sửa
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

