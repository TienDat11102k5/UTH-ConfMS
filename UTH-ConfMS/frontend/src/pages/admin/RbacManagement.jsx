import React from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const roles = [
  { name: "Admin", permissions: ["manage_users", "manage_conferences", "manage_ai", "backup"] },
  { name: "Chair", permissions: ["assign_reviewer", "view_all_submissions"] },
  { name: "Reviewer", permissions: ["review_submission"] },
  { name: "Author", permissions: ["submit_paper", "view_own_reviews"] },
];

const RbacManagement = () => {
  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Quản lý RBAC"
      subtitle="Xem nhanh vai trò và quyền mặc định (dữ liệu minh họa)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">RBAC</span>
          </div>
          <h2 className="data-page-title">Vai trò & quyền</h2>
          <p className="data-page-subtitle">
            Kết nối API để chỉnh sửa quyền và lưu xuống backend. Hiện đang hiển thị dữ liệu demo.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "140px" }}>Vai trò</th>
              <th>Quyền</th>
              <th style={{ width: "160px" }}></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name}>
                <td>{role.name}</td>
                <td>
                  <div className="inline-actions">
                    {role.permissions.map((p) => (
                      <span key={p} className="badge-soft">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="inline-actions">
                    <button className="btn-primary table-action" type="button">
                      Sửa
                    </button>
                    <button className="btn-secondary table-action" type="button">
                      Sao chép
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default RbacManagement;

