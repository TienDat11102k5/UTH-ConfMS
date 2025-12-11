// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">404 - Không tìm thấy trang</h1>
        <p className="auth-subtitle">
          Đường dẫn bạn truy cập không tồn tại trong hệ thống UTH-ConfMS.
        </p>

        <div style={{ marginTop: "16px" }}>
          <Link to="/" className="link-inline">
            Về trang cổng thông tin hội nghị
          </Link>
        </div>

        <div className="auth-footer">
          <span>Hoặc </span>
          <Link to="/login" className="link-inline">
            quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
