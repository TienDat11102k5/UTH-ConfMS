// src/pages/author/AuthorDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import "../../styles/AuthorPages.css";

const AuthorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    underReview: 0,
    accepted: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/submissions");
        const submissions = Array.isArray(res.data) ? res.data : [];
        
        const underReview = submissions.filter(
          s => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW"
        ).length;
        
        const accepted = submissions.filter(
          s => s.status === "ACCEPTED"
        ).length;
        
        setStats({
          underReview,
          accepted,
          total: submissions.length,
        });
      } catch (err) {
        console.error("Error loading stats", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Bảng điều khiển Tác giả"
      subtitle="Quản lý bài nộp, theo dõi trạng thái phản biện và tải lên bản camera-ready cho hội nghị hiện tại."
    >
      <div className="dash-grid">
        <div className="dash-card author-card-primary">
          <div className="card-number">01</div>
          <h3>Nộp bài mới</h3>
          <p>
            Tạo submission mới với hỗ trợ AI: kiểm tra ngữ pháp, cải thiện văn phong, 
            gợi ý từ khóa thông minh. Tải lên file PDF theo mẫu của hội nghị.
          </p>
          <Link to="/author/submit" className="btn-primary btn-card-action">
            Mở form nộp bài
          </Link>
        </div>

        <div className="dash-card author-card-secondary">
          <div className="card-number">02</div>
          <h3>Danh sách bài đã nộp</h3>
          <p>
            Xem tất cả submission mà bạn là tác giả hoặc đồng tác giả. Theo dõi
            trạng thái real-time: submitted, under review, decision, camera-ready.
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            Xem bảng submission
          </Link>
        </div>

        <div className="dash-card author-card-accent">
          <div className="card-number">03</div>
          <h3>Kết quả &amp; Review ẩn danh</h3>
          <p>
            Sau khi có quyết định, xem kết quả Accept / Reject và các nhận xét đã
            được ẩn danh từ Reviewer. Phản hồi chi tiết giúp cải thiện bài báo.
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            Xem kết quả bài báo
          </Link>
        </div>

        <div className="dash-card author-card-success">
          <div className="card-number">04</div>
          <h3>Camera-ready &amp; Bản cuối</h3>
          <p>
            Với bài được Accept, tải lên bản camera-ready, cập nhật metadata cuối
            cùng (tác giả, affiliation, PDF) trước khi đưa vào chương trình và kỷ yếu.
          </p>
          <Link to="/author/camera-ready" className="btn-secondary btn-card-action">
            Quản lý camera-ready
          </Link>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="author-stats-section">
        <h2 className="section-title">Thống kê nhanh</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
            Đang tải thống kê...
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card stat-card-warning">
              <div className="stat-value">{stats.underReview}</div>
              <div className="stat-label">Bài đang chờ review</div>
            </div>
            <div className="stat-card stat-card-success">
              <div className="stat-value">{stats.accepted}</div>
              <div className="stat-label">Bài được chấp nhận</div>
            </div>
            <div className="stat-card stat-card-primary">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng số bài nộp</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuthorDashboard;
