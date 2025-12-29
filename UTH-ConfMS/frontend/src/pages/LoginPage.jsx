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
              Đăng nhập bằng Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
