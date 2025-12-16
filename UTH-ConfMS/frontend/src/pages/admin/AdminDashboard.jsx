// src/pages/admin/AdminDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const AdminDashboard = () => {
  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Bảng điều khiển Site Administrator"
      subtitle="Quản trị nền tảng đa hội nghị: tenancy, RBAC, SMTP/quota, backup/restore và AI governance."
    >
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Tenancy &amp; RBAC</h3>
          <p>
            Quản lý nhiều conference trong cùng một hệ thống, tạo tài khoản, gán
            vai trò (Author, Reviewer, PC, Chair, Admin) và phân quyền truy cập
            chi tiết.
          </p>
          <div className="inline-actions">
            <Link to="/admin/users" className="btn-primary">
              Quản lý người dùng
            </Link>
            <Link to="/admin/rbac" className="btn-secondary">
              Cấu hình RBAC
            </Link>
          </div>
        </div>

        <div className="dash-card">
          <h3>SMTP &amp; Mail quota</h3>
          <p>
            Cấu hình SMTP server, domain gửi email, giới hạn quota theo hội
            nghị, theo dõi lỗi gửi và trạng thái hàng đợi email.
          </p>
          <Link to="/admin/email-settings" className="btn-secondary">
            Cấu hình email hệ thống
          </Link>
        </div>

        <div className="dash-card">
          <h3>Backup / Restore &amp; Logs</h3>
          <p>
            Thực hiện backup định kỳ dữ liệu hội nghị, khôi phục khi cần; xem
            audit log các thao tác quan trọng trong hệ thống.
          </p>
          <div className="inline-actions">
            <Link to="/admin/backups" className="btn-secondary">
              Backup / Restore
            </Link>
            <Link to="/admin/logs" className="btn-secondary">
              Audit Logs
            </Link>
          </div>
        </div>

        <div className="dash-card">
          <h3>AI Governance Controls</h3>
          <p>
            Bật / tắt từng tính năng AI (grammar check, summary, similarity
            hints…), xem log AI (prompt, model ID, timestamp, input hash) và
            xuất báo cáo phục vụ kiểm toán.
          </p>
          <Link to="/admin/ai-governance" className="btn-secondary">
            Bảng điều khiển AI governance
          </Link>
        </div>

        <div className="dash-card">
          <h3>Conference Management</h3>
          <p>Quản lý hội nghị: tạo, chỉnh sửa, xoá hội nghị (chỉ admin).</p>
          <Link to="/admin/conferences" className="btn-primary">
            Quản lý hội nghị
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
