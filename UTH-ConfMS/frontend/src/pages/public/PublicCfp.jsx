import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/PublicCfp.css";

const PublicCfp = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleSubmitPaper = () => {
    if (isLoggedIn) {
      navigate("/author/submit");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="public-cfp-page">
      {/* HERO */}
      <section className="cfp-hero">
        <h1>Call for Papers</h1>
        <p>
          Hội nghị Khoa học Công nghệ UTH 2025 trân trọng kính mời các giảng viên,
          nhà nghiên cứu và sinh viên gửi bài tham gia.
        </p>
        <button className="btn-primary" onClick={handleSubmitPaper}>
          Nộp bài ngay
        </button>
      </section>

      {/* CONTENT */}
      <section className="cfp-content">
        <div className="cfp-block">
          <h2>📚 Chủ đề (Topics)</h2>
          <ul>
            <li>Trí tuệ nhân tạo & Machine Learning</li>
            <li>Khoa học dữ liệu & Big Data</li>
            <li>Công nghệ phần mềm</li>
            <li>An toàn thông tin</li>
            <li>Hệ thống thông tin & ERP</li>
          </ul>
        </div>

        <div className="cfp-block">
          <h2>📅 Thời hạn quan trọng</h2>
          <ul>
            <li>Hạn nộp bài: <strong>30/08/2025</strong></li>
            <li>Thông báo kết quả: <strong>20/09/2025</strong></li>
            <li>Hội nghị diễn ra: <strong>15/10/2025</strong></li>
          </ul>
        </div>

        <div className="cfp-block">
          <h2>📝 Hướng dẫn nộp bài</h2>
          <p>
            Bài viết phải là công trình nghiên cứu gốc, chưa từng được công bố.
            Ngôn ngữ sử dụng: <strong>Tiếng Việt hoặc Tiếng Anh</strong>.
          </p>
          <p>
            Tác giả nộp bài thông qua hệ thống UTH-ConfMS và theo dõi phản biện
            trực tuyến.
          </p>
        </div>

        <div className="cfp-actions">
          <button className="btn-primary" onClick={handleSubmitPaper}>
            Nộp bài
          </button>
          <Link to="/conferences" className="btn-secondary">
            Xem danh sách hội nghị
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PublicCfp;
