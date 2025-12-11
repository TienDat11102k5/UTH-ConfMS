// src/pages/author/AuthorDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const AuthorDashboard = () => {
  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-mark">UTH</span>
          <span className="dash-logo-text">Author Dashboard</span>
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
          <h1 className="dash-title">Xin chào, Author</h1>
          <p className="dash-subtitle">
            Đây là bảng điều khiển dành cho tác giả: nơi bạn có thể nộp bài, xem trạng
            thái bài, kết quả và upload camera-ready.
          </p>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>Nộp bài mới</h3>
              <p>Tạo submission mới cho hội nghị hiện tại.</p>
              <button className="btn-primary">Nộp bài</button>
            </div>

            <div className="dash-card">
              <h3>Bài đã nộp</h3>
              <p>Xem danh sách bài đã gửi, trạng thái review và quyết định.</p>
              <button className="btn-secondary">Xem danh sách</button>
            </div>

            <div className="dash-card">
              <h3>Camera-ready</h3>
              <p>Tải lên bản camera-ready cho bài được chấp nhận.</p>
              <button className="btn-secondary">Quản lý camera-ready</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthorDashboard;
