// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, setCurrentUser } from "../auth";
import apiClient from "../apiClient";
import "../styles/UserProfilePage.css";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    affiliation: "",
    country: "",
    bio: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Khởi tạo form với dữ liệu user hiện tại
    setFormData({
      fullName: currentUser.fullName || currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      affiliation: currentUser.affiliation || "",
      country: currentUser.country || "",
      bio: currentUser.bio || "",
    });

    setAvatarPreview(
      currentUser.photoURL || currentUser.avatarUrl || currentUser.avatar
    );
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Kiểm tra file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }

    setUploadingAvatar(true);
    setError("");

    try {
      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload lên server
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await apiClient.post("/user/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Cập nhật user trong localStorage
      const updatedUser = { ...currentUser, ...res.data };
      setCurrentUser(updatedUser, { remember: true });

      setSuccess("Cập nhật avatar thành công!");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể upload avatar. Vui lòng thử lại."
      );
      // Rollback preview
      setAvatarPreview(
        currentUser.photoURL || currentUser.avatarUrl || currentUser.avatar
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiClient.put("/user/profile", formData);

      // Cập nhật user trong localStorage
      const updatedUser = { ...currentUser, ...res.data };
      setCurrentUser(updatedUser, { remember: true });

      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="profile-avatar-large"
                />
              ) : (
                <div className="profile-avatar-placeholder-large">
                  {getInitials(formData.fullName)}
                </div>
              )}
              {uploadingAvatar && (
                <div className="avatar-uploading">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <label className="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  style={{ display: "none" }}
                />
                {uploadingAvatar ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
              </label>
              <p className="avatar-hint">JPG, PNG, GIF (tối đa 5MB)</p>
            </div>
          </div>

          {/* Profile Form */}
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Thông tin cơ bản</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Họ và tên *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                    title="Email không thể thay đổi"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Quốc gia</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Việt Nam"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="affiliation">Cơ quan/Tổ chức</label>
                <input
                  id="affiliation"
                  name="affiliation"
                  type="text"
                  value={formData.affiliation}
                  onChange={handleChange}
                  placeholder="Trường Đại học, Công ty..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Giới thiệu bản thân</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Viết vài dòng về bản thân, lĩnh vực nghiên cứu..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
              >
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>

          {/* Account Info */}
          <div className="account-info-section">
            <h2>Thông tin tài khoản</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Vai trò:</span>
                <span className="info-value">
                  {currentUser.role?.replace("ROLE_", "") || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className="info-value status-active">Hoạt động</span>
              </div>
              {currentUser.createdAt && (
                <div className="info-item">
                  <span className="info-label">Ngày tạo:</span>
                  <span className="info-value">
                    {new Date(currentUser.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
