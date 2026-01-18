// src/pages/LoginPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import { setToken, setCurrentUser } from "../auth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../firebase";

/* =========================
   TOAST STYLES
   ========================= */
const toastStyles = {
  container: {
    position: "fixed", top: "24px", right: "24px", zIndex: 9999,
    display: "flex", flexDirection: "column", gap: "12px",
  },
  toast: {
    padding: "16px 20px", borderRadius: "25px",
    boxShadow: "0 4px 20px rgba(13, 148, 136, 0.3)",
    display: "flex", alignItems: "center", gap: "12px",
    animation: "slideIn 0.4s ease-out",
    minWidth: "280px", maxWidth: "380px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  success: { background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", color: "white" },
  error: { background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", color: "white" },
  icon: {
    fontSize: "18px", width: "28px", height: "28px", borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  message: { flex: 1, fontSize: "14px", fontWeight: "600", letterSpacing: "0.3px" },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white",
    cursor: "pointer", fontSize: "16px", padding: "4px 8px", borderRadius: "50%",
    opacity: 0.9, transition: "all 0.2s ease",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "24px", height: "24px",
  },
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ ...toastStyles.toast, ...toastStyles[type] }}>
      <span style={toastStyles.icon}>{type === "success" ? "✓" : "✕"}</span>
      <span style={toastStyles.message}>{message}</span>
      <button style={toastStyles.closeBtn} onClick={onClose}>×</button>
    </div>
  );
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
if (!document.querySelector("#toast-keyframes")) {
  styleSheet.id = "toast-keyframes";
  document.head.appendChild(styleSheet);
}

const normalizeRole = (user) => {
  const raw = user?.role || user?.primaryRole || user?.roles?.[0]?.name || user?.roles?.[0] || "";
  if (!raw) return "";
  return raw.startsWith("ROLE_") ? raw.substring(5) : raw;
};

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);


  useEffect(() => {
    if (location.state?.logoutSuccess) {
      setToast({ message: t('auth.logoutSuccess'), type: "success" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, t]);

  const from = useMemo(() => {
    return (location.state && location.state.from && location.state.from.pathname) || "/";
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
    if (accessToken) setToken(accessToken, { remember: rememberMe });
    if (user) setCurrentUser(user, { remember: rememberMe });
    setToast({ message: t('auth.loginSuccess'), type: "success" });
    setTimeout(() => navigate(routeByRole(user), { replace: true }), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setToast(null);
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", { email, password });
      saveAuthAndRedirect(res.data);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || t('auth.loginFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setToast(null);
    setGoogleLoading(true);

    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const res = await apiClient.post("/auth/firebase/google", { idToken });
      saveAuthAndRedirect(res.data);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || t('auth.googleLoginFailed');
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div style={toastStyles.container}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="auth-page auth-layout">

        <div className="auth-right">
          <div className="auth-card">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <LanguageSwitcher />
            </div>
            <h1 className="auth-title">{t('auth.loginTitle')}</h1>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>{t('common.email')} *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>{t('auth.password')} *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="form-row">
                <label className="checkbox">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>{t('auth.rememberMe')}</span>
                </label>
                <Link to="/forgot-password" className="link-inline">{t('auth.forgotPassword')}</Link>
              </div>

              <button className="btn-primary" disabled={loading || googleLoading}>
                {loading ? t('app.loading') : t('auth.login')}
              </button>

              <div className="auth-divider">{t('auth.orLoginWith')}</div>

              <button type="button" className="btn-google" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                {googleLoading ? t('app.loading') : t('auth.googleLogin')}
              </button>
            </form>

            <div className="auth-footer">
              {t('auth.noAccount')}{" "}
              <Link to="/register" className="link-primary">{t('auth.registerNow')}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
