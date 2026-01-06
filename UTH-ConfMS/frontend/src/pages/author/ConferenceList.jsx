// src/pages/author/ConferenceList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import logoUTH from "../../assets/logoUTH.jpg";
import "../../styles/ConferenceList.css";
import "../../styles/AuthorPages.css";
const ConferenceList = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await apiClient.get("/conferences", {
          skipAuth: true,
        });
        setConferences(response.data);
      } catch (err) {
        console.error(err);
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("currentUser");
          navigate("/login");
        } else {
          setError("Không thể tải danh sách hội nghị.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConferences();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "Sắp diễn ra";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading...
      </div>
    );
  if (error)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {error}
      </div>
    );

  return (
    <div className="portal-page">
      <PortalHeader />
      {/* HERO SECTION */}
      <section className="conf-hero">
        <div className="conf-hero-content">
          <div>
            <div className="badge-soft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="badge-icon">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              UTH · Academic Conferences
            </div>
            <h1 className="conf-title">
              Khám phá tri thức
              <br />
              <span>Kết nối tương lai</span>
            </h1>
            <p className="conf-desc">
              Nền tảng quản lý hội nghị khoa học của Trường ĐH Giao thông Vận
              tải TP.HCM. Theo dõi chương trình, nộp bài và kết nối với cộng
              đồng nghiên cứu.
            </p>
            <div className="conf-cta">
              <Link to="/author/submissions/new" className="btn-primary">
                Nộp bài ngay
              </Link>
              <Link to="/program" className="btn-secondary">
                Xem chương trình
              </Link>
            </div>
            <div className="conf-meta">
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 21V7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="meta-number">{conferences.length}</span>
                  <span className="meta-label">Hội nghị đang mở</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="meta-number">24+</span>
                  <span className="meta-label">Chủ đề nghiên cứu</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="meta-number">An toàn</span>
                  <span className="meta-label">
                    Quản lý minh bạch
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="conf-hero-card">
            <div className="hero-card-header">
              <img src={logoUTH} alt="UTH logo" className="hero-logo" />
              <div>
                <div className="hero-label">UTH ConfMS</div>
                <div className="hero-sub">Paper submission &amp; review</div>
              </div>
            </div>
            <ul className="hero-list">
              <li>Đăng ký hội nghị và theo dõi timeline</li>
              <li>Nộp bài, cập nhật camera-ready và metadata</li>
              <li>Nhận thông báo kết quả và phản biện ẩn danh</li>
              <li>Quản lý profile, ORCID và thông tin nhóm tác giả</li>
            </ul>
            <Link to="/author/submit" className="btn-primary full-width">
              Nộp bài ngay
            </Link>
          </div>
        </div>
      </section>

      {/* EVENT SCHEDULE SECTION */}
      <section className="event-schedule-section">
        <div className="schedule-header">
          <div>
            <div className="schedule-label">LỊCH TRÌNH</div>
            <h2 className="schedule-title">Sự kiện sắp tới</h2>
          </div>
          <Link to="/conferences" className="view-all-link">
            Xem tất cả <span className="arrow">→</span>
          </Link>
        </div>

        {conferences.length === 0 ? (
          <div className="schedule-grid">
            <div className="event-card placeholder-card">
              <div className="placeholder-content">
                <span className="placeholder-icon">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 2V6" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10H21" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p>Sự kiện mới đang cập nhật</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="schedule-grid">
            {conferences.map((conf) => {
              const startDate = new Date(conf.startDate);
              const day = startDate.getDate();
              const monthYear = `THÁNG ${startDate.getMonth() + 1}, ${startDate.getFullYear()}`;

              return (
                <div key={conf.id} className="event-card">
                  <div className="event-card-top-bar"></div>
                  <div className="event-card-body">
                    <div className="event-date-row">
                      <div className="date-block">
                        <span className="date-day">{day}</span>
                        <span className="date-month-year">{monthYear}</span>
                      </div>
                      <div className="calendar-icon-wrapper">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 2V6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 2V6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 10H21" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 14H8.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 14H12.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 14H16.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 18H8.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 18H12.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 18H16.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="event-title">{conf.name}</h3>
                    <p className="event-desc">
                      {conf.description ||
                        "Hội nghị thường niên về các giải pháp giao thông thông minh và phát triển bền vững..."}
                    </p>

                    <div className="event-stats-row">
                      <div className="stat-pill">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                          <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {conf.submissionCount || 0} Bài viết
                      </div>
                      <div className="stat-pill">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                          <path d="M8 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 6H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 12H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {conf.tracks?.length || 1} Chủ đề
                      </div>
                    </div>

                    <div className="event-actions">
                      <Link
                        to={`/conferences/${conf.id}`}
                        className="btn-event-detail"
                      >
                        Xem chi tiết
                      </Link>
                      <Link
                        to={`/author/submissions/new?confId=${conf.id}`}
                        className="btn-event-submit"
                      >
                        Nộp bài
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Always show a placeholder card at the end if needed, or just keep it simple */}
            <div className="event-card placeholder-card">
              <div className="placeholder-content">
                <div className="placeholder-icon-box">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 2V6" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10H21" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p>Sự kiện mới đang cập nhật</p>
              </div>
            </div>
          </div>
        )}
      </section>
      <footer className="portal-footer">
        © 2025 UTH-ConfMS. Hệ thống quản lý hội nghị nghiên cứu khoa học UTH.
      </footer>
    </div>
  );
};

export default ConferenceList;
