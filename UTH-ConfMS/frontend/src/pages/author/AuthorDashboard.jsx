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
        console.error("Lỗi khi tải thống kê", err);
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
      title="Cổng thông tin Tác giả"
      subtitle="Quản lý bài nộp khoa học, theo dõi quá trình phản biện và nộp bản hoàn chỉnh cho hội nghị."
      showGreeting={true}
    >
      <div className="dash-grid">
        <div className="dash-card author-card-primary">
          <div className="card-number">01</div>
          <h3>Nộp bài khoa học mới</h3>
          <p>
            Tạo bài nộp mới với hỗ trợ trí tuệ nhân tạo: kiểm tra ngữ pháp,
            cải thiện văn phong học thuật và gợi ý từ khóa phù hợp. Tải lên
            tệp PDF theo đúng định dạng quy định của hội nghị.
          </p>
          <Link to="/author/submit" className="btn-primary btn-card-action">
            Mở biểu mẫu nộp bài
          </Link>
        </div>

        <div className="dash-card author-card-secondary">
          <div className="card-number">02</div>
          <h3>Danh sách bài đã nộp</h3>
          <p>
            Xem toàn bộ các bài báo mà bạn là tác giả hoặc đồng tác giả. Theo dõi
            trạng thái xử lý theo thời gian thực: đã nộp, đang phản biện,
            có quyết định và bản hoàn chỉnh.
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            Xem danh sách bài nộp
          </Link>
        </div>

        <div className="dash-card author-card-accent">
          <div className="card-number">03</div>
          <h3>Kết quả &amp; phản biện ẩn danh</h3>
          <p>
            Xem quyết định Chấp nhận / Từ chối và các nhận xét phản biện ẩn danh
            từ Reviewer để cải thiện chất lượng bài báo.
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            Xem kết quả đánh giá
          </Link>
        </div>

        <div className="dash-card author-card-success">
          <div className="card-number">04</div>
          <h3>Bản hoàn chỉnh </h3>
          <p>
            Tải lên bản camera-ready và cập nhật thông tin cuối cùng cho các
            bài được chấp nhận trước khi xuất bản kỷ yếu hội nghị.
          </p>
          <Link to="/author/camera-ready" className="btn-secondary btn-card-action">
            Nộp bản cuối
          </Link>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="author-stats-section">
        <h2 className="section-title">Thống kê nhanh</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
            Đang tải dữ liệu thống kê...
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card stat-card-warning">
              <div className="stat-value">{stats.underReview}</div>
              <div className="stat-label">Bài đang chấm </div>
            </div>
            <div className="stat-card stat-card-success">
              <div className="stat-value">{stats.accepted}</div>
              <div className="stat-label">Bài được chấp nhận</div>
            </div>
            <div className="stat-card stat-card-primary">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng số bài đã nộp</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuthorDashboard;
