// src/pages/ResetPasswordPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../apiClient";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // token lấy từ query: /reset-password?token=xxxx
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // đồng bộ lại token khi URL thay đổi
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!token || token.trim().length < 10) {
      setError("Token không hợp lệ. Vui lòng mở link đặt lại mật khẩu từ email/log backend.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });

      setSuccessMsg("Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn hoặc đã được dùng.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đặt lại mật khẩu</h1>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Token: auto fill từ URL, vẫn cho sửa để test */}
          <div className="form-group">
            <label htmlFor="token">Reset Token *</label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán token từ link reset"
              required
            />
            <div className="field-hint">
              Token thường nằm trong URL: <code>/reset-password?token=...</code>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới *</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Xác nhận mật khẩu mới *</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="link-inline">
            Quay lại đăng nhập
          </Link>
        </div>

        <div className="auth-footer">
          <Link to="/forgot-password" className="link-inline">
            Gửi lại yêu cầu quên mật khẩu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
