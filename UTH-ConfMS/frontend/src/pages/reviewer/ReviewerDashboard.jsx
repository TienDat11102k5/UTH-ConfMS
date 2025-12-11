// src/pages/reviewer/ReviewerDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ReviewerDashboard = () => {
  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-mark">UTH</span>
          <span className="dash-logo-text">Reviewer / PC Dashboard</span>
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
          <h1 className="dash-title">Bảng điều khiển Reviewer / PC</h1>
          <p className="dash-subtitle">
            Xem các bài được phân công, gửi nhận xét/điểm, tham gia thảo luận nội bộ PC
            và theo dõi tiến độ review.
          </p>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>Bài được phân công</h3>
              <p>Danh sách submission bạn đang review.</p>
              <button className="btn-primary">Xem danh sách</button>
            </div>

            <div className="dash-card">
              <h3>Thảo luận PC</h3>
              <p>Tham gia thảo luận nội bộ với các PC khác cho từng bài.</p>
              <button className="btn-secondary">Mở diễn đàn</button>
            </div>

            <div className="dash-card">
              <h3>Bidding &amp; gợi ý AI</h3>
              <p>
                Xem gợi ý bài phù hợp từ embedding/topic (optional, theo cấu hình AI).
              </p>
              <button className="btn-secondary">Xem gợi ý</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReviewerDashboard;
