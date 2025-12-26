// src/pages/author/AuthorDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const AuthorDashboard = () => {
  return (
    <DashboardLayout
      roleLabel="Author"
      title="Bảng điều khiển Tác giả"
      subtitle="Quản lý bài nộp, theo dõi trạng thái phản biện và tải lên bản camera-ready cho hội nghị hiện tại."
    >
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Nộp bài mới</h3>
          <p>
            Tạo submission mới: nhập tiêu đề, tóm tắt, từ khóa, chọn track/topic và
            tải lên file PDF theo mẫu của hội nghị.
          </p>
          <Link to="/author/submit" className="btn-primary">
            Mở form nộp bài
          </Link>
        </div>

        <div className="dash-card">
          <h3>Danh sách bài đã nộp</h3>
          <p>
            Xem tất cả submission mà bạn là tác giả hoặc đồng tác giả; theo dõi
            trạng thái (submitted, under review, decision, camera-ready).
          </p>
          <Link to="/author/submissions" className="btn-secondary">
            Xem bảng submission
          </Link>
        </div>

        <div className="dash-card">
          <h3>Kết quả &amp; review ẩn danh</h3>
          <p>
            Sau khi có quyết định, xem kết quả Accept / Reject và các nhận xét đã
            được ẩn danh từ Reviewer, phục vụ cải thiện bài báo.
          </p>
          <Link to="/author/submissions" className="btn-secondary">
            Xem kết quả bài báo
          </Link>
        </div>

        <div className="dash-card">
          <h3>Camera-ready &amp; bản cuối</h3>
          <p>
            Với bài được Accept, tải lên bản camera-ready, cập nhật metadata cuối
            cùng (tác giả, affiliation, PDF) trước khi đưa vào chương trình và
            kỷ yếu.
          </p>
          <Link to="/author/camera-ready" className="btn-secondary">
            Quản lý camera-ready
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuthorDashboard;
