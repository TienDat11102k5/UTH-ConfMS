// src/pages/public/PublicHomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import logoUth from "../../assets/logoUTH.jpg";

const PublicHomePage = () => {
  return (
    <div className="portal-page">
      <div className="portal-header-container">
        <header className="portal-header">
          <div className="portal-logo">
            <img
              src={logoUth}
              alt="UTH Logo"
              className="portal-logo-img"
              style={{
                height: "190px",
                width: "auto",
                marginRight: "0px",
                mixBlendMode: "multiply",
              }}
            />

            <div className="portal-logo-text">
              <div className="portal-logo-title">UTH-CONFMS</div>
              <div className="portal-logo-subtitle">
                UTH Scientific Conference Paper Management System
              </div>
            </div>
          </div>

          <nav className="portal-nav">
            <Link to="/proceedings" className="nav-link">
              Proceedings
            </Link>
            <Link to="/login" className="nav-link">
              Đăng nhập
            </Link>
            <Link to="/register" className="nav-link nav-link-primary">
              Đăng ký
            </Link>
          </nav>
        </header>
      </div>

      <main className="portal-main">
        <section className="portal-hero">
          <div className="portal-hero-left">
            <div className="portal-badge">
              Portal Hội nghị Nghiên cứu khoa học UTH
            </div>
            <h1 className="portal-title">
              Quản lý CFP, nộp bài, phản biện và chương trình hội nghị trong một
              hệ thống.
            </h1>
            <p className="portal-description">
              Hệ thống UTH-ConfMS hỗ trợ luồng EasyChair-style: Call for Papers
              → Submission → Review → Decision → Camera-ready → Program &amp;
              Proceedings, với RBAC, SSO, audit log và AI hỗ trợ (tùy chọn).
            </p>

            <div className="portal-actions">
              <Link to="/login" className="btn-primary">
                Đăng nhập hệ thống
              </Link>
              <Link to="/register" className="btn-secondary">
                Đăng ký Author mới
              </Link>
            </div>

            <p className="portal-note">
              Vai trò Reviewer / PC / Chair / Admin sẽ được gán bởi Ban tổ chức
              sau khi bạn có tài khoản.
            </p>
          </div>

          <div className="portal-hero-right">
            <div className="portal-card-grid">
              <div className="portal-card">
                <div className="portal-card-label">Author</div>
                <h3 className="portal-card-title">
                  Nộp bài &amp; Camera-ready
                </h3>
                <p className="portal-card-text">
                  Nộp bài, cập nhật metadata, thêm đồng tác giả, theo dõi kết
                  quả, tải lên bản camera-ready và xem nhận xét ẩn danh.
                </p>
              </div>

              <div className="portal-card">
                <div className="portal-card-label">Reviewer / PC</div>
                <h3 className="portal-card-title">
                  Phản biện &amp; thảo luận nội bộ
                </h3>
                <p className="portal-card-text">
                  Nhận bài được phân công, gửi điểm &amp; nhận xét, tham gia
                  thảo luận nội bộ PC, xử lý COI và thời hạn review.
                </p>
              </div>

              <div className="portal-card">
                <div className="portal-card-label">Chair &amp; Admin</div>
                <h3 className="portal-card-title">
                  Quản lý hội nghị &amp; AI governance
                </h3>
                <p className="portal-card-text">
                  Cấu hình conference, tracks, deadlines, phân công bài, quyết
                  định Accept / Reject, gửi email hàng loạt, quản lý SMTP, quota
                  và audit log AI.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-section">
          <h2 className="portal-section-title">Luồng hội nghị (tóm tắt)</h2>
          <div className="portal-timeline">
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">1</div>
              <div className="portal-timeline-content">
                <h3>Call for Papers (CFP)</h3>
                <p>Tạo trang CFP, chủ đề, tracks, deadline và mẫu email.</p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">2</div>
              <div className="portal-timeline-content">
                <h3>Submission</h3>
                <p>
                  Author nộp bài, chỉnh sửa trước hạn; kiểm tra định dạng và
                  COI.
                </p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">3</div>
              <div className="portal-timeline-content">
                <h3>Review &amp; Discussion</h3>
                <p>
                  PC assign bài, Reviewer phản biện, thảo luận nội bộ, rebuttal
                  (nếu bật).
                </p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">4</div>
              <div className="portal-timeline-content">
                <h3>Decision &amp; Camera-ready</h3>
                <p>
                  Quyết định Accept/Reject, gửi email, mở vòng camera-ready và
                  export chương trình.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} UTH-ConfMS. Hệ thống quản lý hội nghị
          nghiên cứu khoa học UTH.
        </span>
      </footer>
    </div>
  );
};

export default PublicHomePage;
