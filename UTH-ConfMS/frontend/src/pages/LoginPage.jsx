// src/pages/LoginPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../apiClient";
import { setToken, setCurrentUser } from "../auth";

import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../firebase";

const normalizeRole = (user) => {
  // hỗ trợ nhiều dạng trả về từ backend
  const raw =
    user?.role ||
    user?.primaryRole ||
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    "";

  if (!raw) return "";
  return raw.startsWith("ROLE_") ? raw.substring(5) : raw; // ROLE_AUTHOR -> AUTHOR
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const from = useMemo(() => {
    return (
      (location.state && location.state.from && location.state.from.pathname) ||
      "/"
    );
  }, [location.state]);

  const routeByRole = (user) => {
    const role = normalizeRole(user);

    if (role === "AUTHOR") return "/author";
    if (role === "REVIEWER" || role === "PC") return "/reviewer";
    if (role === "CHAIR" || role === "TRACK_CHAIR") return "/chair";
    if (role === "ADMIN") return "/admin";

    return from;
  };

  const saveAuthAndRedirect = (data) => {
    const { accessToken, user } = data || {};
    if (accessToken) {
      setToken(accessToken, { remember: rememberMe });
    }
    if (user) {
      setCurrentUser(user, { remember: rememberMe });
    }
    navigate(routeByRole(user), { replace: true });
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

      // Backend cần 1 endpoint nhận Firebase ID Token để đổi ra JWT của hệ thống
      // Ví dụ: POST /api/auth/firebase/google  { idToken }
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
        <h1 className="auth-title">Đăng nhập UTH-ConfMS</h1>

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

            <Link to="/forgot-password" className="link-inline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || googleLoading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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
