// src/pages/chair/ChairDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ChairDashboard = () => {
  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-mark">UTH</span>
          <span className="dash-logo-text">Chair Dashboard</span>
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
          <h1 className="dash-title">Bảng điều khiển Program / Track Chair</h1>
          <p className="dash-subtitle">
            Quản lý conference, tracks, deadlines, phân công bài, theo dõi tiến độ và đưa
            ra quyết định cuối cùng.
          </p>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>Conference &amp; CFP</h3>
              <p>Cấu hình thông tin conference, CFP, deadline và templates.</p>
              <button className="btn-primary">Quản lý CFP</button>
            </div>

            <div className="dash-card">
              <h3>Phân công &amp; tiến độ</h3>
              <p>Quản lý assignment reviewer, theo dõi tiến độ review và SLA.</p>
              <button className="btn-secondary">Xem tiến độ</button>
            </div>

            <div className="dash-card">
              <h3>Quyết định &amp; thông báo</h3>
              <p>Aggregate reviews, quyết định Accept/Reject và gửi email hàng loạt.</p>
              <button className="btn-secondary">Màn hình quyết định</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChairDashboard;
