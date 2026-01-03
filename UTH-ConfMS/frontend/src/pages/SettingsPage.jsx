// src/pages/SettingsPage.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../auth";
import apiClient from "../apiClient";
import { ToastContainer } from "../components/Toast";
import "../styles/SettingsPage.css";

const SettingsPage = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Add toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Remove toast helper
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast("Mật khẩu mới và xác nhận mật khẩu không khớp", "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      addToast("Đổi mật khẩu thành công!", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.message ||
        "Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const isGoogleUser = currentUser.provider === "GOOGLE";

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Cài đặt</h1>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>


        <div className="settings-content">
          {/* Password Section - Only for LOCAL users */}
          {!isGoogleUser && (
            <div className="settings-section">
              <h2>Đổi mật khẩu</h2>
              <p className="section-description">
                Cập nhật mật khẩu của bạn để bảo mật tài khoản
              </p>

              <form className="settings-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Mật khẩu hiện tại *</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">Mật khẩu mới *</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isGoogleUser && (
            <div className="settings-section">
              <h2>Đổi mật khẩu</h2>
              <div className="info-box">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                    fill="#3b82f6"
                  />
                </svg>
                <p>
                  Bạn đang sử dụng tài khoản Google để đăng nhập. Để thay đổi mật
                  khẩu, vui lòng truy cập trang quản lý tài khoản Google.
                </p>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SettingsPage;