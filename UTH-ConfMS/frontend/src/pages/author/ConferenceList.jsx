// src/pages/author/ConferenceList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import logoUTH from "../../assets/logoUTH.jpg";
import "../../styles/ConferenceList.css";
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
            <div className="badge-soft">UTH · Academic Conferences</div>
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
              <Link to="/author/dashboard" className="btn-primary">
                Vào Dashboard tác giả
              </Link>
              <Link to="/program" className="btn-secondary">
                Xem chương trình
              </Link>
            </div>
            <div className="conf-meta">
              <div className="meta-item">
                <span className="meta-number">{conferences.length}</span>
                <span className="meta-label">Hội nghị đang mở</span>
              </div>
              <div className="meta-item">
                <span className="meta-number">24+</span>
                <span className="meta-label">Chủ đề nghiên cứu</span>
              </div>
              <div className="meta-item">
                <span className="meta-number">An toàn</span>
                <span className="meta-label">
                  Quản lý &amp; theo dõi minh bạch
                </span>
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

      {/* CARD GRID */}
      <section className="conf-section">
        {conferences.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
            Hiện chưa có hội nghị nào.
          </p>
        ) : (
          <div className="conf-grid">
            {conferences.map((conf) => (
              <div key={conf.id} className="conf-card">
                <div>
                  <span className="conf-date">
                    {formatDate(conf.startDate)}
                  </span>
                </div>

                <h3 className="conf-card-title">{conf.name}</h3>

                <p className="conf-card-desc">
                  {conf.description ||
                    "Hội nghị chuyên sâu về các xu hướng công nghệ mới nhất..."}
                </p>

                <div className="conf-stats">
                  <span>{conf.tracks?.length || 0} Tracks</span>
                </div>

                <div className="conf-actions">
                  <Link
                    to={`/conferences/${conf.id}`}
                    className="btn-secondary"
                  >
                    Xem chi tiết
                  </Link>
                  <Link to="/author/dashboard" className="btn-primary">
                    Nộp bài
                  </Link>
                </div>
              </div>
            ))}
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
