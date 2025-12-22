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

          <div className="auth-divider">Hoặc đăng nhập bằng</div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
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

