// src/pages/LoginPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../apiClient";
import { setToken, setCurrentUser } from "../auth";

import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../firebase";

/* =========================
   HELPERS
   ========================= */
const normalizeRole = (user) => {
  const raw =
    user?.role ||
    user?.primaryRole ||
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    "";

  if (!raw) return "";
  return raw.startsWith("ROLE_") ? raw.substring(5) : raw;
};

/* =========================
   COMPONENT
   ========================= */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===== TAB STATE (NEW) ===== */
  const [activeTab, setActiveTab] = useState("general");

  const from = useMemo(() => {
    return (
      (location.state &&
        location.state.from &&
        location.state.from.pathname) ||
      "/"
    );
  }, [location.state]);

  /* =========================
     ROUTING BY ROLE
     ========================= */
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

  /* =========================
     HANDLERS
     ========================= */
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

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="auth-page auth-layout">
      {/* ===== LEFT: NOTICE BOARD ===== */}
      <div className="auth-left">
        <div className="notice-container">
          <div className="notice-tabs">
            <span
              className={`tab ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              THÔNG BÁO CHUNG
            </span>
            <span
              className={`tab ${activeTab === "training" ? "active" : ""}`}
              onClick={() => setActiveTab("training")}
            >
              ĐÀO TẠO
            </span>
            <span
              className={`tab ${activeTab === "ctct" ? "active" : ""}`}
              onClick={() => setActiveTab("ctct")}
            >
              CTCT - SV
            </span>
          </div>

          <div className="notice-list">
            {activeTab === "general" && (
              <>
                <div className="notice-item">
                  <div className="notice-text">
                    Thông báo về hạn nộp bài hội nghị UTH-ConfMS 2025
                    <div className="date">11/12/2025</div>
                  </div>
                  <span className="detail">Xem chi tiết</span>
                </div>

                <div className="notice-item">
                  <div className="notice-text">
                    Thông báo lịch tổ chức hội nghị khoa học
                    <div className="date">05/12/2025</div>
                  </div>
                  <span className="detail">Xem chi tiết</span>
                </div>
              </>
            )}

            {activeTab === "training" && (
              <div className="notice-item">
                <div className="notice-text">
                  Thông báo kế hoạch đào tạo năm học 2025
                  <div className="date">08/12/2025</div>
                </div>
                <span className="detail">Xem chi tiết</span>
              </div>
            )}

            {activeTab === "ctct" && (
              <div className="notice-item">
                <div className="notice-text">
                  Hướng dẫn sinh viên đăng ký tài khoản hệ thống
                  <div className="date">28/11/2025</div>
                </div>
                <span className="detail">Xem chi tiết</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== RIGHT: LOGIN FORM ===== */}
      <div className="auth-right">
        <div className="auth-card">
          <h1 className="auth-title">Đăng nhập UTH-ConfMS</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button className="btn-primary" disabled={loading || googleLoading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="auth-divider">Hoặc đăng nhập bằng</div>

            <button
              type="button"
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              {googleLoading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
            </button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="link-primary">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
