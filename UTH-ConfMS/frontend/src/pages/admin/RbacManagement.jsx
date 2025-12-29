import { useState, useEffect } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from '../../apiClient';

const RbacManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(roles, 20);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles');
      setRoles(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Không thể tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  const translateRoleName = (roleName) => {
    const translations = {
      'ROLE_ADMIN': 'Admin',
      'ROLE_CHAIR': 'Chair',
      'ROLE_REVIEWER': 'Reviewer',
      'ROLE_AUTHOR': 'Author'
    };
    return translations[roleName] || roleName;
  };

  const translatePermission = (permission) => {
    const translations = {
      'manage_users': 'Quản lý người dùng',
      'manage_conferences': 'Quản lý hội nghị',
      'manage_ai': 'Quản lý AI',
      'backup_restore': 'Sao lưu/Khôi phục',
      'view_audit_logs': 'Xem nhật ký',
      'lock_conferences': 'Khóa hội nghị',
      'create_conference': 'Tạo hội nghị',
      'edit_conference': 'Sửa hội nghị',
      'assign_reviewers': 'Phân công reviewer',
      'view_all_submissions': 'Xem tất cả bài nộp',
      'make_decisions': 'Ra quyết định',
      'view_assigned_papers': 'Xem bài được phân',
      'submit_reviews': 'Nộp review',
      'view_own_reviews': 'Xem review của mình',
      'submit_papers': 'Nộp bài',
      'view_own_submissions': 'Xem bài nộp',
      'upload_camera_ready': 'Nộp bản cuối',
      'view_decisions': 'Xem quyết định'
    };
    return translations[permission] || permission;
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý RBAC" subtitle="Xem vai trò và quyền trong hệ thống.">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Quản lý RBAC" subtitle="Xem vai trò và quyền trong hệ thống.">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý RBAC"
      subtitle="Xem vai trò và quyền trong hệ thống."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">RBAC</span>
          </div>
          <h2 className="data-page-title">Vai trò &amp; Quyền</h2>
          <p className="data-page-subtitle">
            Hệ thống sử dụng 4 vai trò cố định với các quyền được định nghĩa sẵn.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "120px" }}>Vai trò</th>
              <th style={{ width: "140px" }}>Số người dùng</th>
              <th>Quyền</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((role) => (
              <tr key={role.id}>
                <td>
                  <strong>{translateRoleName(role.name)}</strong>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>
                    {role.userCount} người
                  </span>
                </td>
                <td>
                  <div className="inline-actions" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                    {role.permissions.map((p) => (
                      <span key={p} className="badge-soft" style={{ fontSize: '0.8rem' }}>
                        {translatePermission(p)}
                      </span>
                    ))}
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


