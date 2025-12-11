// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../apiClient";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from =
    (location.state && location.state.from && location.state.from.pathname) ||
    "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      // Giả sử backend trả về: { accessToken, refreshToken, user: { id, name, role } }
      const { accessToken, user } = response.data || {};

      if (accessToken) {
        if (rememberMe) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("currentUser", JSON.stringify(user));
        } else {
          sessionStorage.setItem("accessToken", accessToken);
          sessionStorage.setItem("currentUser", JSON.stringify(user));
        }
      }

      // Điều hướng theo role cơ bản (tùy backend)
      if (user && user.role === "AUTHOR") {
        navigate("/author", { replace: true });
      } else if (user && (user.role === "REVIEWER" || user.role === "PC")) {
        navigate("/reviewer", { replace: true });
      } else if (user && (user.role === "CHAIR" || user.role === "TRACK_CHAIR")) {
        navigate("/chair", { replace: true });
      } else if (user && user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập UTH-ConfMS</h1>
        <p className="auth-subtitle">
          Đăng nhập để truy cập hệ thống hội nghị (Author / Reviewer / PC / Chair / Admin).
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu *</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            {/* Nếu sau này có chức năng reset password thì gắn link */}
            {/* <Link to="/forgot-password" className="link-inline">
              Quên mật khẩu?
            </Link> */}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Chưa có tài khoản?</span>{" "}
          <Link to="/register" className="link-inline">
            Đăng ký ngay
          </Link>
        </div>

        <div className="auth-footer">
          <span>Hoặc quay lại </span>
          <Link to="/" className="link-inline">
            Cổng thông tin hội nghị (CFP)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
