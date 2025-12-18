// src/pages/admin/AdminLoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import { setToken, setCurrentUser } from "../../auth";

import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../../firebase";

const normalizeRole = (user) => {
  // hỗ trợ nhiều dạng trả về từ backend
  const raw =
    user?.role ||
    user?.primaryRole ||
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    "";

  if (!raw) return "";
  return raw.startsWith("ROLE_") ? raw.substring(5) : raw; // ROLE_ADMIN -> ADMIN
};

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const saveAuthAndRedirect = (data) => {
    const { accessToken, user } = data || {};
    
    if (accessToken) {
      setToken(accessToken, { remember: rememberMe });
    }
    if (user) {
      setCurrentUser(user, { remember: rememberMe });
    }
    
    // Kiểm tra role ADMIN
    const role = normalizeRole(user);
    if (role !== "ADMIN") {
      setError("Tài khoản này không có quyền truy cập trang quản trị. Vui lòng đăng nhập bằng tài khoản Admin.");
      // Xóa token và user nếu không phải admin
      setToken(null);
      setCurrentUser(null);
      return;
    }
    
    // Nếu là admin, redirect đến trang admin
    navigate("/admin", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", { email, password });
      saveAuthAndRedirect(res.data);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();

      const res = await apiClient.post("/auth/firebase/google", { idToken });
      saveAuthAndRedirect(res.data);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đăng nhập Google thất bại.";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập Admin</h1>
        <p className="auth-subtitle">Trang quản trị hệ thống UTH-ConfMS</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu *</label>
            <input
              id="password"
              name="password"
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

            <Link to="/forgot-password" className="link-inline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || googleLoading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập Admin"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            style={{ width: "100%", marginTop: "0.75rem" }}
          >
            {googleLoading
              ? "Đang đăng nhập Google..."
              : "Đăng nhập bằng Google"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Quay lại </span>
          <Link to="/login" className="link-inline">
            Trang đăng nhập thông thường
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

export default AdminLoginPage;

