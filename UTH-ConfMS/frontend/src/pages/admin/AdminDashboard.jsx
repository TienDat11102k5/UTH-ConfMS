// src/pages/admin/AdminDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-mark">UTH</span>
          <span className="dash-logo-text">Site Administrator</span>
        </div>
        <nav className="dash-header-right">
          <Link to="/" className="nav-link">
            Cổng thông tin
          </Link>
          <Link to="/login" className="nav-link">
            Đăng xuất
          </Link>
        </nav>
      </header>

      <main className="dash-main">
        <section className="dash-section">
          <h1 className="dash-title">Bảng điều khiển Site Administrator</h1>
          <p className="dash-subtitle">
            Quản trị nền tảng đa hội nghị: tenancy, RBAC, SMTP/quota, backup/restore và AI
            governance.
          </p>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>Tenancy &amp; RBAC</h3>
              <p>Quản lý hội nghị, người dùng và phân quyền hệ thống.</p>
              <button className="btn-primary">Quản lý người dùng</button>
            </div>

            <div className="dash-card">
              <h3>SMTP &amp; Mail quota</h3>
              <p>Cấu hình SMTP, giới hạn gửi email và giám sát lỗi gửi.</p>
              <button className="btn-secondary">Cấu hình email</button>
            </div>

            <div className="dash-card">
              <h3>AI governance &amp; audit</h3>
              <p>Xem log AI, bật/tắt từng tính năng và xuất báo cáo.</p>
              <button className="btn-secondary">Mở bảng AI governance</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
