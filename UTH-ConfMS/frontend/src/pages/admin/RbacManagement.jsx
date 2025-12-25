import React from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

const roles = [
  {
    name: "Admin",
    permissions: ["manage_users", "manage_conferences", "manage_ai", "backup"],
  },
  {
    name: "Chair",
    permissions: ["assign_reviewer", "view_all_submissions"],
  },
  {
    name: "Reviewer",
    permissions: ["review_submission"],
  },
  {
    name: "Author",
    permissions: ["submit_paper", "view_own_reviews"],
  },
];

const RbacManagement = () => {
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(roles, 20);

  return (
    <AdminLayout title="Quản lý RBAC"
      subtitle="Xem nhanh vai trò và quyền mặc định (dữ liệu minh họa)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">RBAC</span>
          </div>
          <h2 className="data-page-title">Vai trò &amp; quyền</h2>
          <p className="data-page-subtitle">
            Khi nối backend, bạn có thể chỉnh sửa, thêm mới vai trò và ánh xạ quyền chi tiết.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "140px" }}>Vai trò</th>
              <th>Quyền</th>
              <th style={{ width: "180px" }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((role) => (
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

      {roles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={roles.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="vai trò"
        />
      )}
    </AdminLayout>
  );
};

export default RbacManagement;


