// src/pages/author/ConferenceList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import "../../styles/ConferenceList.css";

const ConferenceList = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await apiClient.get("/conferences", { skipAuth: true });
        setConferences(response.data || []);
      } catch (err) {
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

  if (loading) {
    return <div className="page-center">Loading...</div>;
  }

  if (error) {
    return <div className="page-center">{error}</div>;
  }

  return (
    <div className="portal-page">
      {/* HEADER */}
      <header className="dash-header uth-header">
        <div className="dash-header-left">
          <div className="dash-logo-mark">UTH</div>
          <span className="dash-logo-text">Conference Portal</span>
        </div>

        <nav className="portal-nav">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/program" className="nav-link">Chương trình</Link>

          <Link to="/author/dashboard" className="btn-dashboard-nav">
            🚀 Dashboard tác giả
          </Link>

          <button
            className="nav-link logout-btn"
            onClick={() => {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("currentUser");
              navigate("/login");
            }}
          >
            Đăng xuất
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="conf-hero">
        <div className="conf-hero-content">
          <h1 className="conf-title">
            Khám phá Tri thức
            <span>Kết nối Tương lai</span>
          </h1>
          <div className="hero-actions">
            <Link to="/program" className="btn-secondary">Xem chương trình</Link>
            <Link to="/author/dashboard" className="btn-primary">Nộp bài</Link>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="conf-section">
        <h2 className="section-title">Danh sách hội nghị</h2>

        {conferences.length === 0 ? (
          <p className="empty-text">Hiện chưa có hội nghị nào.</p>
        ) : (
          <div className="conf-grid">
            {conferences.map((conf) => (
              <div key={conf.id} className="conf-card">
                <div className="conf-card-header">
                  <span className="conf-date">📅 {formatDate(conf.startDate)}</span>
                  <span className="conf-badge">UTH</span>
                </div>

                <h3 className="conf-card-title">{conf.name}</h3>

                <p className="conf-card-desc">
                  {conf.description || "Hội nghị chuyên sâu về các xu hướng công nghệ mới nhất."}
                </p>

                <div className="conf-stats">
                  <span>📍 {conf.venue || "Online / TP.HCM"}</span>
                  <span>📚 {conf.tracks?.length || 0} Tracks</span>
                </div>

                <div className="conf-actions">
                  <Link to={`/conferences/${conf.id}`} className="btn-outline">
                    Chi tiết
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
        © 2025 UTH Conference Management System
      </footer>
    </div>
  );
};

export default ConferenceList;