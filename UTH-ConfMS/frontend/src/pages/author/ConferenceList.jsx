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
      {" "}
      {/* Class này lấy background từ index.css */}
      {/* HEADER: Dùng style của Dash-header cho đồng bộ */}
      <header
        className="dash-header"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="dash-header-left">
          <div className="dash-logo-mark">UTH</div>
          <span className="dash-logo-text">Portal</span>
        </div>

        <nav className="portal-nav">
          <Link to="/" className="nav-link">
            Trang chủ
          </Link>
          <Link to="/program" className="nav-link">
            Chương trình
          </Link>

          {/* NÚT DASHBOARD NỔI BẬT NHƯNG ĐÚNG MÀU INDEX */}
          <Link to="/author/dashboard" className="btn-dashboard-nav">
            <span>🚀</span> Vào Dashboard Tác Giả
          </Link>

          <button
            className="nav-link"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              marginLeft: "10px",
              color: "#da1e28",
            }}
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
      {/* HERO SECTION */}
      <section className="conf-hero">
        <h1 className="conf-title">
          Khám phá Tri thức <br />
          <span>Kết nối Tương lai</span>
        </h1>
        <p className="conf-desc">
          Nền tảng quản lý hội nghị khoa học uy tín. Nơi quy tụ các chuyên gia
          hàng đầu trong lĩnh vực Công nghệ thông tin.
        </p>
        <button className="btn-secondary" style={{ padding: "0.8rem 2rem" }}>
          Tìm hiểu thêm
        </button>
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
                    📅 {formatDate(conf.startDate)}
                  </span>
                </div>

                <h3 className="conf-card-title">{conf.name}</h3>

                <p className="conf-card-desc">
                  {conf.description ||
                    "Hội nghị chuyên sâu về các xu hướng công nghệ mới nhất..."}
                </p>

                <div className="conf-stats">
                  <span>📍 {conf.venue || "Online / TP.HCM"}</span>
                  <span>📚 {conf.tracks?.length || 0} Tracks</span>
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
        © 2025 UTH Conference Management System.
      </footer>
    </div>
  );
};

export default ConferenceList;
