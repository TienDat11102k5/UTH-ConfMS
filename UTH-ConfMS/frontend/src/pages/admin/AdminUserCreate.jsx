import React from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const AdminUserCreate = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Tạo tài khoản"
      subtitle="Trang tạo tài khoản tối giản (chưa kết nối backend)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/users" className="breadcrumb-link">
              Người dùng
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tạo tài khoản</span>
          </div>
          <h2 className="data-page-title">Tạo tài khoản mới</h2>
          <p className="data-page-subtitle">
            Chức năng đang được phát triển. Bạn có thể quay lại danh sách.
          </p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 720 }}>
        <h3>Thông tin tài khoản</h3>
        <div className="form-group">
          <label className="form-label">Họ tên</label>
          <input disabled value="" placeholder="(chưa hỗ trợ)" />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input disabled value="" placeholder="(chưa hỗ trợ)" />
          </div>
          <div className="form-group">
            <label className="form-label">Vai trò</label>
            <input disabled value="" placeholder="(chưa hỗ trợ)" />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUserCreate;
