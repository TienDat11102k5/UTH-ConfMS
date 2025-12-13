// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../auth";
import apiClient from "../apiClient";
import "../styles/SettingsPage.css";

const SettingsPage = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setError("");
    setSuccess("");

    // Validate
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."
      );
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

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

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

          {/* Notifications Section */}
          <div className="settings-section">
            <h2>Thông báo</h2>
            <p className="section-description">
              Quản lý cách bạn nhận thông báo từ hệ thống
            </p>

            <div className="settings-options">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email thông báo</h3>
                  <p>Nhận email khi có cập nhật về bài nộp của bạn</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Thông báo review</h3>
                  <p>Nhận thông báo khi có review mới cho bài nộp</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Thông báo quyết định</h3>
                  <p>Nhận thông báo khi có quyết định Accept/Reject</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="settings-section">
            <h2>Quyền riêng tư</h2>
            <p className="section-description">
              Quản lý thông tin cá nhân và quyền riêng tư của bạn
            </p>

            <div className="settings-options">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Hiển thị email công khai</h3>
                  <p>Cho phép người khác xem địa chỉ email của bạn</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Hiển thị profile công khai</h3>
                  <p>Cho phép người khác xem thông tin profile của bạn</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
